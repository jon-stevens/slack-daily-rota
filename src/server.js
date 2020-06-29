const {
	Worker
} = require('worker_threads');
const express = require('express');
const bodyParser = require('body-parser');
const request = require("request");

const config = require('./config');

const worker = new Worker('./src/worker.js', {workerData: config});
worker.on('error', (error) => {
	throw error;
});
worker.on('exit', (code) => {
	if (code !== 0)
		throw new Error(`Worker stopped with exit code ${code}`);
});

const app = express();
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('view engine', 'pug');
app.set('views', './src/views')

app.post('/auth/redirect', (req, res) => {
    const options = {
        uri: 'https://slack.com/api/oauth.access?code='
            +req.query.code+
            '&client_id='+config.slackClientId+
            '&client_secret='+config.slackClientSecret+
            '&redirect_uri=/rota',
        method: 'GET'
    };
    request(options, (error, response, body) => {
        const JSONresponse = JSON.parse(body);
        if (!JSONresponse.ok) {
            res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end();
        } else {
            res.send("Success!");
        }
    });
});

const webAppData = {
	title: 'Slack Rota App'
};

function doPostMessage(res, slackMessage) {
    worker.postMessage(slackMessage);
	res.render('index', { title: webAppData.title, message: 'Message sent to slack!', slackMessage: JSON.stringify(slackMessage)});
}

function who(res, command) {
	const slackMessage = {
        command
	};     
	doPostMessage(res, slackMessage);
}

app.get('/', (req, res) => {
	res.render('index', { title: webAppData.title, message: webAppData.title});
});

app.post('/who', (req, res) => {
    who(res, 'today');
});

app.get('/who', (req, res) => {
	who(res, 'today');
});

app.post('/actions', (req, res) => {
    const payload = JSON.parse(req.body.payload);
	const slackMessage = {
        command: 'skip',
        requester: payload.user.name
	};    
    if(payload.actions[0].text.text.includes(config.skipButtonMessage)) {
        doPostMessage(res, slackMessage);
    } else {
        res.render('index', { title: webAppData.title, message: 'Unable to perform action.'});
    };
});

module.exports = {
	app,
	config
};
