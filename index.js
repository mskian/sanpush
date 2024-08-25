const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');
const subscriptionRoutes = require('./src/routes/subscription');
const notificationRoutes = require('./src/routes/notification');

const publicVapidKey = 'Enter your Public Key';
const privateVapidKey = 'Enter your Private Key';

webpush.setVapidDetails(
    'mailto:youremail@company.com',
    publicVapidKey,
    privateVapidKey
);

const app = express();
const port = process.env.PORT || 5024;

app.use(express.json());

const allowedOrigins = ['http://localhost:5024',
    'https://yoursite.com'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
             return callback((msg));
        }
        return callback(null, true);
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', subscriptionRoutes.router);
app.use('/api', notificationRoutes);

app.disable("x-powered-by");

app.use((req, res) => {
    res.status(404).json({
        error: 1,
        message: 'Data not Found'
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
