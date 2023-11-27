const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = 3003;

const dnsRecords = {
    'bbc.co.uk': '151.101.0.81',
    'wordpress.org': '198.143.164.252',
    'apple.com': '17.253.144.10',
    'amazon.com': '176.32.103.205',
    'microsoft.com': '40.76.4.15',
    'twitter.com': '104.244.42.193',
    'yahoo.com': '72.30.35.9',
    'instagram.com': '34.199.232.59',
    'linkedin.com': '108.174.10.10',
    'stackoverflow.com': '151.101.129.69'
};

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;
    const ip = dnsRecords[domain];

    console.log("H3");

    if (ip) {
        return res.send({ domain, ip });
    } else {
        try {
            let otherServers = ['http://localhost:3001', 'http://localhost:3002']; 
            for (let url of otherServers) {
                try {
                    let response = await axios.get(`${url}/resolve/${domain}`);
                    if (response.status === 200) {
                        dnsRecords[domain] = response.data.ip;
                        return res.send(response.data);
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
