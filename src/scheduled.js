const {
	Worker
} = require('worker_threads');
const dotenv = require('dotenv');

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

const slackMessage = {
    text: 'today'
};
worker.postMessage(slackMessage);

// process.exit(1);