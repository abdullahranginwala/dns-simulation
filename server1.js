const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const port = 3001;

const dnsRecords = {
    'example.com': '93.184.216.34',
    'google.com': '128.34.216.17',
    'facebook.com': '31.13.67.35',
    'apple.com': '17.253.144.10',
    'amazon.com': '176.32.103.205',
    'microsoft.com': '40.76.4.15',
    'twitter.com': '104.244.42.193',
    'linkedin.com': '108.174.10.10',
    'instagram.com': '34.199.232.59',
    'yahoo.com': '72.30.35.9'
};

app.use(cors());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;
    const ip = dnsRecords[domain];

    console.log("H1");

    if (ip) {
        return res.send({ domain, ip });
    } else {
        try {
            let otherServers = ['http://localhost:3002', 'http://localhost:3003']; 
            for (let url of otherServers) {
                try {
                    let response = await axios.get(`${url}/resolve/${domain}`);
                    if (response.status === 200) return res.send(response.data);
                } catch (error) {
                    continue;
                }
            }
            res.status(404).send({ error: 'Domain not found' });
        } catch (error) {
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
