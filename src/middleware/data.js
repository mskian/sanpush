const fs = require('fs');
const path = require('path');

const SUBSCRIPTION_FILE = path.join(__dirname, '../../db/subscriptions.json');

function loadSubscriptions() {
    if (fs.existsSync(SUBSCRIPTION_FILE)) {
        const data = fs.readFileSync(SUBSCRIPTION_FILE);
        return JSON.parse(data);
    }
    return [];
}

function saveSubscriptions(subscriptions) {
    fs.writeFileSync(SUBSCRIPTION_FILE, JSON.stringify(subscriptions, null, 2));
}

module.exports = { loadSubscriptions, saveSubscriptions };
