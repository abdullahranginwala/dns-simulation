const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
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

let encountered = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;
    const ip = dnsRecords[domain];

    console.log("H1");

    if(encountered[domain]) {
        return res.status(404).send({ error: 'Domain not found' });
    }

    encountered[domain] = true;

    if (ip) {
        encountered = {};
        return res.status(200).send({ domain, ip });
    } else {
        try {
            let otherServers = ['http://localhost:3002', 'http://localhost:3003']; 
            for (let url of otherServers) {
                try {
                    let response = await axios.get(`${url}/resolve/${domain}`);
                    if (response.status == 200) {
                        dnsRecords[domain] = response.data.ip;
                        encountered = {};
                        return res.status(200).send(response.data);
                    }
                } catch (error) {
                    continue;
                }
            }
            res.status(404).send({ error: 'Domain not found' });
        } catch (error) {
            res.status(500).send({ error: 'Internal server error' });
        }
    }
    encountered = {};
});

app.post('/add-domain-ip', (req, res) => {
    const { domain, ip } = req.body;
    console.log(`Adding domain-ip pair to server: ${domain} -> ${ip}`);

    if (!domain || !ip) {
        console.error('Invalid domain or IP address.');
        return res.status(400).send({ error: 'Invalid data' });
    }

    dnsRecords[domain] = ip;

    console.log(`Added domain-ip pair to server: ${domain} -> ${ip}`);
    res.status(200).send({ message: 'Domain-IP pair added to the server' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
