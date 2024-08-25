const express = require('express');
const { check, validationResult } = require('express-validator');
const { loadSubscriptions, saveSubscriptions } = require('../middleware/data');

const router = express.Router();
let subscriptions = loadSubscriptions();

router.post('/subscribe', [
    check('endpoint').isURL().withMessage('Invalid endpoint URL').bail().trim(),
    check('keys.auth').isString().withMessage('Invalid auth key').bail().trim(),
    check('keys.p256dh').isString().withMessage('Invalid p256dh key').bail().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const subscription = req.body;
    const index = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint);

    if (index > -1) {
        subscriptions[index] = subscription;
    } else {
        subscriptions.push(subscription);
    }

    saveSubscriptions(subscriptions);
    return res.status(index > -1 ? 200 : 201).json({ message: index > -1 ? 'Subscription updated successfully' : 'Subscription successful' });
});

router.post('/unsubscribe', [
    check('endpoint').isURL().withMessage('Invalid endpoint URL').bail().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { endpoint } = req.body;
    const initialLength = subscriptions.length;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);

    if (subscriptions.length < initialLength) {
        saveSubscriptions(subscriptions);
        return res.status(200).json({ message: 'Unsubscribed successfully' });
    } else {
        return res.status(404).json({ message: 'Subscription not found' });
    }
});

router.post('/resubscribe', [
    check('endpoint').isURL().withMessage('Invalid endpoint URL').bail().trim(),
    check('keys.auth').isString().withMessage('Invalid auth key').bail().trim(),
    check('keys.p256dh').isString().withMessage('Invalid p256dh key').bail().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const subscription = req.body;
    const index = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint);

    if (index > -1) {
        subscriptions[index] = subscription;
    } else {
        subscriptions.push(subscription);
    }

    saveSubscriptions(subscriptions);
    return res.status(index > -1 ? 200 : 201).json({ message: index > -1 ? 'Subscription updated successfully' : 'Subscription successful' });
});

module.exports = { router };
