// agent.js - Runs LOCAL at your office
const { request } = require('urllib');

// CONFIGURATION
const DEVICE_CONFIG = {
    ip: 'http://192.0.0.64', // Replace with your Device IP
    user: 'admin',
    pass: '!Palma12345678'  // Replace with your password
};

const CLOUD_API = 'https://your-aws-app.com/api/attendance/sync';
const CLOUD_SECRET = 'your-secure-api-key';

async function syncLogs() {
    console.log("Fetching logs from Hikvision device...");

    const targetUrl = `${DEVICE_CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

    const payload = {
        AcsEventCond: {
            searchID: "1",
            searchResultPosition: 0,
            maxResults: 30,
            major: 0,
            minor: 0,
            // Grabs logs from the start of today
            startTime: "2024-02-24T00:00:00+00:00",
            // endTime: "2024-02-23T23:59:59+00:00",
            userInfo: true,

        }
    };

    try {
        // 1. Fetch from Local Device using urllib's native Digest Auth
        const { data, res } = await request(targetUrl, {
            method: 'POST',
            digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
            data: payload,
            contentType: 'json',
            dataType: 'json', // Automatically parses the JSON response
            timeout: 10000    // 10 second timeout
        });

        if (res.status !== 200) {
            console.error(`Device returned error: ${res.status}`);
            return;
        }

        const eventList = data.AcsEvent.InfoList;

        if (eventList && eventList.length > 0) {
            console.log(`Found ${eventList.length} logs. Processing...`);
            console.log(eventList); // Print the logs to the console to verify

            // TODO: Push to AWS Lightsail here
            // await request(CLOUD_API, { method: 'POST', data: { logs: eventList }, ... })

        } else {
            console.log("No new logs found.");
        }

    } catch (error) {
        console.error("Connection error:", error.message);
    }
}

// Run immediately, then every 10 seconds
syncLogs();
setInterval(syncLogs, 10000);