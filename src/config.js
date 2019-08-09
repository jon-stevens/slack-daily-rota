const dotenv = require('dotenv');

dotenv.config();

const config = () => {
    return {
        slackToken: process.env.SLACK_TOKEN,
        slackOAuthToken: process.env.SLACK_OAUTH_TOKEN,
        slackClientId: process.env.SLACK_CLIENT_ID,
        slackClientSecret: process.env.SLACK_CLIENT_SECRET,
        slackHookUrl: process.env.SLACK_HOOK_URL,
        port: process.env.PORT
    }
}

module.exports = config();