const {app, config} = require('./server');

app.listen(config.port, () => {
	console.log(`Server started at http://localhost${config.port}`);
});
