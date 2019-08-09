const {
	Worker
} = require('worker_threads');

const config = require('./config');

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