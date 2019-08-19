const dotenv = require('dotenv');

dotenv.config();

const config = () => {
    return {
        slackToken: process.env.SLACK_TOKEN,
        slackOAuthToken: process.env.SLACK_OAUTH_TOKEN,
        slackClientId: process.env.SLACK_CLIENT_ID,
        slackClientSecret: process.env.SLACK_CLIENT_SECRET,
        slackHookUrl: process.env.SLACK_HOOK_URL,
        appUrl: process.env.APP_URL,
        getRotaUrl: process.env.ROTA_GET_ENDPOINT,
        updateRotaUrl: process.env.ROTA_UPDATE_ENDPOINT,
        port: process.env.PORT,
        databaseUrl: process.env.DATABASE_URL
    }
}

module.exports = config();