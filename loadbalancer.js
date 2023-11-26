const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 8080;

let currentServer = 0;
const servers = ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

// Initialize an empty cache object
const cache = {};

app.use(cors());

app.get('/resolve/:domain', async (req, res) => {
    const domain = req.params.domain;

    // Check if the domain is in the cache
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

            // Store the response in the cache and update usage count
            cache[domain] = { ip: response.data.ip, usageCount: 1 };

            // Check for least used domain
            for (const key in cache) {
                if (cache[key].usageCount < leastUsedCount) {
                    leastUsedDomain = key;
                    leastUsedCount = cache[key].usageCount;
                }
            }

            // Remove the least used domain if the cache size exceeds 10
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

app.listen(port, () => console.log(`Load Balancer running on http://localhost:${port}`));
