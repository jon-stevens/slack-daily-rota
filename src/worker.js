const {workerData, parentPort} = require('worker_threads');
const request = require('request');
const fs = require('fs');

const config = workerData;
const dataFilePath = 'rota-data.json';

function sendMessage(slackMessage, payload, isEphemeral = false) {
	const requestBody = {
		...payload,
		channel: slackMessage.channel_id
	};

	if (isEphemeral) {
		requestBody.user = slackMessage.user_id;
	}

	return new Promise((resolve, reject) => {
		request.post({
			url: isEphemeral ? 'https://slack.com/api/chat.postEphemeral' : 'https://slack.com/api/chat.postMessage',
			json: true,
			body: requestBody,
			headers: {
				'Content-type': 'application/json',
				'Authorization': `Bearer ${config.slackOAuthToken}`
			}
		}, (error, response, responseBody) => {
			if (error) {
				reject(error);
				return;
			} else if (!responseBody.ok) {
				reject(responseBody.error);
				return;
			}

			resolve(responseBody);
		});
	});
}

function sendEphemeralMessage(slackMessage, text) {
	return sendMessage(slackMessage, {text}, true);
}

function getRotaData() {
	return new Promise(resolve, reject => {
		fs.readFile(dataFilePath, (err, data) => {
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(JSON.parse(data.toString()));
		});
	});
}

function setRotaData(dataObj) {
	fs.writeFileSync(dataFilePath, JSON.stringify(Object.assign({}, ...dataObj)), err => {
		if (err) {
			console.log(err);
			return;
		}
	});	
}

class WhosNext {
	constructor() {
		this.people = [{
			name: 'Colleen',
			username: ''
		},
		{
			name: 'Marleen',
			username: ''
		},
		{
			name: 'Amit',
			username: ''
		},
		{
			name: 'Tom',
			username: ''
		},
		{
			name: 'Priyo',
			username: ''
		},
		{
			name: 'Rakesh',
			username: ''
		},
		{
			name: 'Dmitry',
			username: ''
		},
		{
			name: 'Jon S.',
			username: ''
		},
		{
			name: 'Anibe',
			username: ''
		},
		{
			name: 'Mirren',
			username: ''
		},
		{
			name: 'Isabel',
			username: ''
		}];
		this.nonActiveDays = [6, 0]; // Saturday (6) and Sunday (0)
		this.dailyAlertTime24h = '0830';
		this.rotaIndex = 0;
	}

	showName() {
		const isTodayActiveDay = this.nonActiveDays.includes(new Date().getDay());
		if (isTodayActiveDay) {
			const person = this._getActivePerson();
			const blocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `Get ready ${person.name}! You're running stand-up today :wiggle_cat:.\nRemotes join here: https://hangouts.google.com/hangouts/_/springer.com/standup?pli=1&authuser=1`
					}
				}
			];
	
			// Used for the notifications on desktop or mobile
			const text = `${person.name}i s running stand-up today`;
	
			return sendMessage(slackMessage, {blocks, text});			
		}
	}

	skip() {
		// TODO		
	}

	_getActivePerson() {
		let index = 0;

		getRotaData().then(fileData => {
			const numberOfPeople = this.people.length - 1;
			const rotaPositionIndex = fileData.rotaIndex;
			const dateLastUpdated = fileData.date;
			const today = new Date();

			if (today === dateLastUpdated) {
				index = rotaPositionIndex;
			}

			setRotaData({
				rotaIndex: numberOfPeople === index ? 0 : index++,
				date: today
			});
		});

		return this.people[index];
	}
}

function handleError(e) {
	console.error({
		message: e.message || e,
		originalError: e
	});
}

function rota(slackMessage) {
	const who = new WhosNext(slackMessage);
	return who.showName();
}

function handle(slackMessage) {
	if (slackMessage.text.startsWith('today')) {
		rota(slackMessage).catch(handleError);
	} else if (slackMessage.text.startsWith('skip')) {
		rota(slackMessage).catch(handleError);
	} else {
		sendEphemeralMessage(slackMessage, 'Invalid command').catch(handleError);
	}
}

parentPort.on('message', handle);

module.exports = handle;
