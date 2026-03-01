const https = require('https');

const PROJECT_ID = 'g9ebnag6';
const TOKEN = 'sknD5kzV5U1nNu8R6PX7i5n2HUNtR4Wfk8Vcwahn47RoCNnBMfHEazVUGJRWNQI89Q9mc02hcOUqou4Ezb9C569HAkWKLmQZLq9VVvBcTEainy1USxQxASzIrEDC0vXgb6kQPblyIYpmvGJl9VqPlVeNJ7Ql1f74eQNGEjItKmj1JVbE8RkE';

const payload = JSON.stringify({
    origin: 'http://127.0.0.1:3000'
});

const options = {
    hostname: 'api.sanity.io',
    path: `/ v2021-06-07 / projects / ${PROJECT_ID}/cors`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', console.error);
req.write(payload);
req.end();
