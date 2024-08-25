const express = require('express');
const { check, validationResult } = require('express-validator');
const webpush = require('web-push');
const { loadSubscriptions, saveSubscriptions } = require('../middleware/data');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const validateNotification = [
    check('title')
        .trim()
        .isString()
        .withMessage('Title must be a string')
        .notEmpty()
        .withMessage('Title is required')
        .escape(),
    check('body')
        .trim()
        .isString()
        .withMessage('Body must be a string')
        .notEmpty()
        .withMessage('Body is required')
        .escape()
];

router.post('/send-notification', authenticateToken, validateNotification, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, body } = req.body;

    const sanitizedTitle =title;
    const sanitizedBody = body;

    const payload = JSON.stringify({ title: sanitizedTitle, body: sanitizedBody });

    try {
        const subscriptions = loadSubscriptions();
        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub, payload);
                return { success: true, endpoint: sub.endpoint };
            } catch (err) {
                if (err.statusCode === 410) {
                    return { success: false, endpoint: sub.endpoint, error: 'Subscription no longer exists' };
                }
                return { success: false, endpoint: sub.endpoint, error: err.message };
            }
        }));

        const failed = results.filter(result => !result.success);

        if (failed.length > 0) {
            console.error('Failed notifications:', failed);
            const updatedSubscriptions = subscriptions.filter(sub => !failed.some(f => f.endpoint === sub.endpoint));
            saveSubscriptions(updatedSubscriptions);
            res.status(500).json({ 
                error: 'Failed to send notification to some endpoints', 
                details: failed 
            });
        } else {
            res.status(200).json({ message: 'Notification sent successfully' });
        }
    } catch (err) {
        console.error('Failed to send notification:', err);
        res.status(500).json({ error: 'Failed to send notification', details: err.message });
    }
});

module.exports = router;
