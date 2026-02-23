const { request } = require('urllib');

// CONFIGURATION
const DEVICE_CONFIG = {
    ip: 'http://192.168.10.42',
    user: 'admin',
    pass: '!Palma12345678'
};

// Global map to store our users in memory (e.g., { "1": "John", "2": "Jane" })
let employeeMap = {};

// 1. Function to Fetch and Memorize Users
async function updateEmployeeMap() {
    const targetUrl = `${DEVICE_CONFIG.ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;
    const payload = { UserInfoSearchCond: { searchID: "1", searchResultPosition: 0, maxResults: 1000 } };

    try {
        const { data, res } = await request(targetUrl, {
            method: 'POST',
            digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
            data: payload,
            contentType: 'json', dataType: 'json', timeout: 10000
        });

        if (res.status === 200 && data.UserInfoSearch && data.UserInfoSearch.UserInfo) {
            // Rebuild the map with the fresh data
            employeeMap = {};
            data.UserInfoSearch.UserInfo.forEach(user => {
                employeeMap[user.employeeNo] = user.name;
            });
            console.log(`[Users] Synced ${Object.keys(employeeMap).length} employees into memory.`);
        }
    } catch (error) {
        console.error("[Users] Failed to update employee list:", error.message);
    }
}

// 2. Function to Fetch Logs and Attach Names
async function syncLogs() {
    const targetUrl = `${DEVICE_CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

    // Creates a clean date string like "2026-02-23T00:00:00+00:00" for Hikvision
    const todayClean = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('.')[0] + '+00:00';
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString().split('.')[0] + '+00:00';

    const payload = {
        AcsEventCond: {
            searchID: "1", searchResultPosition: 0, maxResults: 30, major: 0, minor: 0,
            startTime: todayClean,
            endTime: todayEnd
        }
    };

    try {
        const { data, res } = await request(targetUrl, {
            method: 'POST',
            digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
            data: payload,
            contentType: 'json', dataType: 'json', timeout: 10000
        });

        if (res.status === 200 && data.AcsEvent && data.AcsEvent.InfoList) {
            const rawLogs = data.AcsEvent.InfoList;

            // Map the names to the logs!
            const enrichedLogs = rawLogs.map(log => {
                const empId = log.employeeNoString;
                return {
                    id: empId,
                    // Look up the name in our map. If not found, use "Unknown"
                    name: employeeMap[empId] || "Unknown",
                    time: log.time,
                    // major 5 & minor 75 usually means "Fingerprint Verification Success"
                    eventType: log.minor
                };
            });

            console.log(`[Logs] Processed ${enrichedLogs.length} logs:`);
            console.log(enrichedLogs); // Verify the names are there!

            // TODO: Push enrichedLogs to AWS Lightsail

        }
    } catch (error) {
        console.error("[Logs] Connection error:", error.message);
    }
}

// 3. Main Loop
async function startAgent() {
    console.log("Starting Local Bridge Agent...");

    // Fetch users immediately on startup
    await updateEmployeeMap();

    // Fetch logs immediately, then every 10 seconds
    syncLogs();
    // setInterval(syncLogs, 10000);

    // Re-sync the employee list every 1 hour (in case you add new people)
    setInterval(updateEmployeeMap, 3600000);
}

startAgent();