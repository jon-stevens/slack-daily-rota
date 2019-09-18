const { workerData, parentPort } = require('worker_threads');
const request = require('request');
const { Client } = require('pg');

const config = workerData;

const db = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl: config.appMode !== 'dev'
});

db.connect();

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
			url: isEphemeral ? 'https://slack.com/api/chat.postEphemeral' : config.slackHookUrl,
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
				reject('error', responseBody.error);
				return;
			}

			resolve(responseBody);
		});
	});
}

function sendEphemeralMessage(slackMessage, text) {
	return sendMessage(slackMessage, { text }, true);
}

function getRotaData() {
	return new Promise((resolve, reject) => {
		db.query('SELECT row_data FROM rota_data WHERE row_id=1;', (err, res) => {
			if (err) {
				reject(err);
				throw err;
			}
			const data = res.rows[0].row_data;
			resolve(JSON.parse(data));
		});
	});
}

function updateRotaData(dataObj) {
	return new Promise((resolve, reject) => {
		const text = 'UPDATE rota_data SET row_data = ($2) WHERE row_id=($1)';
		const values = [1, JSON.stringify(dataObj)];

		db.query(text, values)
			.then(res => {
				resolve(console.log('data posted to endpoint!'));
			})
			.catch(e => reject(e.stack))
	});
}

function generateRandomMessage(id) {

	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	const messages = [
		`I hope you're wearing a nappy, because ${id} is doing a standup today! :happy-sad:`,
		`Put some seatbealts on your ears, because ${id} is totally going to take them on an epic journey in today's standup`,
		`${id} wants everybody to know that they are going to do a standup today and that everybody better be ready for it :happy-sad:`,
		`${id} is going to make you question the futility of your own existence in today's standup`,
		`Clear your diaries because ${id} is going to standup at you today, and it doesn't get much better than that! :excited:`,
		`Future ${id} just appeared in a dustbin and told me that past ${id} did the best most amazing standup this morning, so make sure you're wearing socks.`,
		`The seat of your trousers are going to be thinner and more strained than that teabag that I saw Tom punching the other day, becasue ${id} is going to do a standup! :tea:`,
		`Imagine a moth doing a standup! How rubbish would that be! Luckily ${id} is doing it today, which will be marginally more exciting. :happy-sad:`,
		`If Chuck Norris did standup, he might go to ${id} for advice because ${id} is super at doing standups. It's not the best life skill but its better than nothing.`,
		`Last time ${id} did a standup, my socks fell off and I had a dream about plums. So I'm looking forward to this morning, it will temporarily alleviate the strain of a transient existence. :happy-sad:`,
		`Last time Rakesh pushed me down the stairs, ${id} came to me in a dream and said don't worry. One day I will be doing a standup and you will forget about your broken legs. ${id} we love you. :boxing_glove:`,
		`Have you forgotten the sensation of joy? Have you woken up today feeling like a wooden ladder? Don't worry, ${id} will run today's standup and we are all going to feel good again.`,
		`Make standups great again, ${id}! Bless your tiny tiny miraculous face`,
		`${id} is doing a standup today, and after that big fight they had on the train this morning, it should be a lively one :ballmer:`,
		`${id} is doing the full standup experience today, remember not to mention how they tried to force Jovi to live in the fridge for a week, we're not supposed to mention that. :jackfruit:`,
		`All the rumours about ${id} are untrue, they are doing a standup this morning, and isn't even allergic to eggs. :egg:`,
		`Remember the last time ${id} did the standup, and there was a big fight at the end, and Dmitry took his shoes off and chased everyone Oh wait that was a dream. I think it probably won't be that good. :dmitryk:`,
		`I heard ${id} was caught trying to iron a homeless dog this morning. I hope they are still OK to do the standup.`,
		`When ${id} does the standup it feels like you are slipping into an enormous warm quiche, and before long you start wishing you had been born this way, why why am I a shell-less human? Destined for nothing but suffering and confusion? I want to be have a quiche-shell.`,
		`${id} has a voice like a beautiful warm wind farm, and today we are going to be filled with renewable energy, after today's STANDUP!`,
		`Take me far away, and put some cheese in my ears, because ${id} is doing the standup today. I am filled with dread.`,
		`Whenever ${id} does the standup, my feet shift uncomfortably, like an embarrassed gearbox. But it is not from boredom, or guilt, or worrying about that unresolved blood debt. It's because ${id} has a voice like a bassoon.`,
		`:cat2: is doing a standup this morning. Oh wait it's ${id} I think. Not :cat2: who is a cat and therefore a total dumbo. :happy-sad:`,
		`${id} is presenting today's standup, live from Nottingham County Court, where they are facing charges of trying to demolish their local newsagents with a stolen steamroller.`,
		`${id} is going to do today's standup in French. So I hope you speak French. :flag-fr:`,
		`In addition to running standup today, ${id} will also be inspecting every team member's socks :socks:`
	];

	return messages[getRandomInt(0, messages.length - 1)];
}

class WhosNext {
	constructor(slackMessage) {
		this.people = [{
			name: 'Colleen',
			username: '<@U0GJL3M8D>'
		},
		{
			name: 'Marleen',
			username: '<@U70KW5VHV>'
		},
		{
			name: 'Amit',
			username: '<@UHV8K7VN3>'
		},
		{
			name: 'Tom',
			username: '<@U14GHSETH>'
		},
		{
			name: 'Slava',
			username: '<@UEBPZBRR9>'
		},
		{
			name: 'Rakesh',
			username: '<@U0GJA3NF6>'
		},
		{
			name: 'Dmitry',
			username: '<@U4ENT1HUJ>'
		},
		{
			name: 'Jon S.',
			username: '<@U7JSC2P9S>'
		},
		{
			name: 'Anibe',
			username: '<@U83QSM30D>'
		},
		{
			name: 'Mirren',
			username: '<@UDQQ3RHPF>'
		},
		{
			name: 'Isabel',
			username: '<@UGNC53L3V>'
		}];
		this.nonWeekDays = [6, 0]; // Saturday (6) and Sunday (0)
		this.nonWorkDates = ['Thu Aug 22 2019', 'Mon Aug 26 2019']; // Public holidays and one-off out of office dates
		this.dailyAlertTime24h = '0830';
		this.rotaIndex = 0;
		this.slackMessage = slackMessage.command;
		this.requester = slackMessage.requester;
	}

	async showName() {
		const today = new Date();
		const isTodayWeekend = this.nonWeekDays.includes(today.getDay());
		const isTodayOfficeHoliday = this.nonWorkDates.includes(today.toDateString());
		if (!isTodayWeekend && !isTodayOfficeHoliday) {
			const person = await this._getActivePerson();
			const msgTxt = generateRandomMessage(`*${person.name}* (${person.username})`);
			const blocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: msgTxt
					}
				},
				{
					"type": "actions",
					"elements": [
						{
							"type": "button",
							"text": {
								"type": "plain_text",
								"text": `${person.name} ${config.skipButtonMessage}`,
								"emoji": true
							}
						}
					]
				}								
			];

			if (this.requester) {
				console.log('there is a requester');
				blocks.push({
					"type": "context",
					"elements": [
						{
							"type": "mrkdwn",
							"text": `${this.requester} skipped to the next person.`
						}
					]
				});
			}

			// Used for the notifications on desktop or mobile
			const text = msgTxt;

			return sendMessage(this.slackMessage, { blocks, text });
		} else {
			const text = 'No standup today :sleeping: :palm_tree:';
			return sendMessage(this.slackMessage, {
				blocks: [{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text
					}
				}], text
			});
		}
	}

	async skip() {
		console.log('Skipped! Show next member');
		return this.showName();
	}

	_getActivePerson() {
		let index = 0;

		return getRotaData().then(fileData => {
			const numberOfPeople = this.people.length - 1;
			const rotaPositionIndex = fileData.rotaIndex;
			const dateLastUpdated = fileData.date;
			const today = new Date().toDateString();

			// if (today === dateLastUpdated) {
			if (fileData) {
				index = rotaPositionIndex;
			}

			updateRotaData({
				rotaIndex: numberOfPeople === index ? 0 : parseInt(index, 10) + 1,
				date: today
			});
			return this.people[index];
		}).catch(e => {
			console.log('unable to get active person', e);
		});
	}
}

function handleError(e) {
	console.trace({
		message: e,
		originalError: e
	});
}

function rota(slackMessage) {
	const who = new WhosNext(slackMessage);
	return who.showName();
}

function skip(slackMessage) {
	const who = new WhosNext(slackMessage);
	return who.skip();
}

function handle(slackMessage) {
	if (slackMessage.command.startsWith('today')) {
		rota(slackMessage).catch(handleError);
	} else if (slackMessage.command.startsWith('skip')) {
		skip(slackMessage).catch(handleError);
	} else {
		sendEphemeralMessage(slackMessage, 'Invalid command').catch(handleError);
	}
}

parentPort.on('message', handle);

module.exports = handle;
