const {
	Worker
} = require('worker_threads');
const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const request = require("request");

dotenv.config();

const config = {
	slackToken: process.env.SLACK_TOKEN,
	slackOAuthToken: process.env.SLACK_OAUTH_TOKEN,
	slackClientId: process.env.SLACK_CLIENT_ID,
	slackClientSecret: process.env.SLACK_CLIENT_SECRET,
	port: process.env.PORT
};

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

app.post('/rota', (req, res) => {
	if (req.body) {
		console.log('Received request', req.body);
	}

	if (!req.body || req.body.token !== config.slackToken) {
		return res.status(401).send('Invalid credentials');
	}

	if (req.body.text.match(/today|skip/) !== null) {
		const slackMessage = req.body;

		res.status(200).end();

		worker.postMessage(slackMessage);
	} else {
		res.json(
			{
				response_type: 'ephemeral',
				text: `Invalid command: \`${req.body.text}\``
			}
		);
	}
});

function who(req, res) {
	const slackMessage = {
		text: 'today'
	};
	worker.postMessage(slackMessage);
	res.render('index', { title: 'Message sent!', message: 'Message sent!'});
}

app.post('/who', (req, res) => {
	who(req, res);
});

app.get('/who', (req, res) => {
	who(req, res);
});

app.get('/', (req, res) => {
	res.render('index', { title: 'Rota!', message: 'Rota!'});
});

module.exports = {
	app,
	config
};
