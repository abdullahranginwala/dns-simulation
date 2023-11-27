const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

let currentServer = 0;
const servers = ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

const cache = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;

    if (cache[domain]) {
        const { ip, usageCount } = cache[domain];
        console.log(`Cache hit for ${domain}`);
        cache[domain].usageCount += 1;
        return res.send({ domain, ip });
    }

    console.log("Resolving domain:", domain);
    currentServer = (currentServer + 1) % servers.length;

    let leastUsedDomain = null;
    let leastUsedCount = Infinity;

    for (let i = 0; i < servers.length; i++) {
        const serverUrl = servers[currentServer + i];
        try {
            console.log(`Trying server: ${serverUrl}`);
            let response = await axios.get(`${serverUrl}/resolve/${domain}`);
            console.log(`Response from ${serverUrl}:`, response.data);

            cache[domain] = { ip: response.data.ip, usageCount: 1 };

            for (const key in cache) {
                if (cache[key].usageCount < leastUsedCount) {
                    leastUsedDomain = key;
                    leastUsedCount = cache[key].usageCount;
                }
            }

            if (Object.keys(cache).length > 10) {
                delete cache[leastUsedDomain];
            }

            return res.send(response.data);
        } catch (error) {
            console.error(`Error from ${serverUrl}:`, error.message);
        }
    }

    console.log(`All servers failed to resolve ${domain}`);
    res.status(500).send({ error: 'Internal server error' });
});

app.post('/add-domain-ip', async (req, res) => {
    const { domain, ip } = req.body;
    console.log(req.body);
    console.log(`Adding domain-ip pair to load balancer: ${domain} -> ${ip}`);

    currentServer = (currentServer + 1) % servers.length;
    const selectedServer = currentServer;
    if (selectedServer === null) {
        console.error('No server available to add the domain-IP pair.');
        return res.status(500).send({ error: 'No server available' });
    }

    const serverUrl = servers[selectedServer];

    try {
        console.log(`Sending data to server: ${serverUrl}`);
        let response = await axios.post(`${serverUrl}/add-domain-ip`, { domain, ip });
        console.log(`Response from server:`, response.data);

        return res.send(response.data);
    } catch (error) {
        console.error(`Error from server:`, error.message);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.listen(port, () => console.log(`Load Balancer running on http://localhost:${port}`));
