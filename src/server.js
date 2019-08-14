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

const appData = {
	title: 'Slack Rota App'
};

function who(req, res) {
	const slackMessage = {
		text: 'today'
	};
	worker.postMessage(slackMessage);
	res.render('index', { title: appData.title, message: 'Message sent to slack!'});
}

app.post('/who', (req, res) => {
	who(req, res);
});

app.get('/who', (req, res) => {
	who(req, res);
});

app.get('/', (req, res) => {
	res.render('index', { title: appData.title, message: appData.title});
});

module.exports = {
	app,
	config
};
