const request = require('request');
const config = require('./config');

request.post(config.appUrl, (err, res, body) => {
	console.error('error:', err); // Print the error if one occurred
	console.log('statusCode:', res && res.statusCode);
});

// process.exit(1);