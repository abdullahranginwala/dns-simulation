const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
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

let encountered = {};

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;
    const ip = dnsRecords[domain];

    console.log("H2");

    if(encountered[domain]) {
        return res.status(404).send({ error: 'Domain not found' });
    }

    encountered[domain] = true;

    if (ip) {
        encountered = {};
        return res.status(200).send({ domain, ip });
    } else {
        try {
            let otherServers = ['http://localhost:3003', 'http://localhost:3001']; 
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
