const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');

// ⚡ COMPRESSION
app.use(compression());

// ⚡ FAST CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    maxAge: 86400
}));

// ⚡ FAST BODY PARSER
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

const pairRouter = require('./alirazaxmd');
app.use('/', pairRouter);

// ⚡ HEALTH CHECK
app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

module.exports = app;