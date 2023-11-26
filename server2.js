const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3002;

const dnsRecords = {
    'wikipedia.org': '91.198.174.192',
    'github.com': '140.82.112.3',
    'reddit.com': '151.101.1.140',
    'netflix.com': '52.52.186.133',
    'linkedin.com': '108.174.10.10',
    'stackoverflow.com': '151.101.129.69',
    'adobe.com': '192.147.130.219',
    'ebay.com': '66.135.195.175',
    'paypal.com': '64.4.250.17',
    'pinterest.com': '151.101.0.84'
};

app.use(cors());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;
    const ip = dnsRecords[domain];

    console.log("H2");

    if (ip) {
        return res.send({ domain, ip });
    } else {
        try {
            let otherServers = ['http://localhost:3001', 'http://localhost:3003']; 
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
