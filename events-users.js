const { request } = require('urllib');
const fs = require('fs');

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

  let currentPosition = 0;
  let keepFetching = true;
  let tempMap = {}; // Temporarily hold users while we loop

  console.log("[Users] Starting employee sync...");

  while (keepFetching) {
    const payload = {
      UserInfoSearchCond: {
        searchID: "1",
        searchResultPosition: currentPosition, // This moves forward every loop
        maxResults: 30
      }
    };

    try {
      const { data, res } = await request(targetUrl, {
        method: 'POST',
        digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
        data: payload,
        contentType: 'json',
        dataType: 'json',
        timeout: 10000
      });

      if (res.status === 200 && data.UserInfoSearch) {
        const matches = data.UserInfoSearch.numOfMatches || 0;
        const users = data.UserInfoSearch.UserInfo || [];

        if (matches > 0 && users.length > 0) {
          // Add this batch of users to our temporary map
          users.forEach(user => {
            tempMap[user.employeeNo] = user.name;
          });

          console.log(`[Users] Fetched ${users.length} users at position ${currentPosition}...`);

          // Move the starting position forward for the next loop
          currentPosition += users.length;
        } else {
          // If 0 matches are returned, we reached the end of the list!
          keepFetching = false;
        }
      } else {
        console.error(`[Users] Device returned error status: ${res.status}`);
        keepFetching = false;
      }
    } catch (error) {
      console.error("[Users] Connection error during sync:", error.message);
      keepFetching = false;
    }
  }

  // Once the loop is totally finished, update our main global map
  if (Object.keys(tempMap).length > 0) {
    employeeMap = tempMap;
    console.log(`✅ [Users] Finished! Synced a total of ${Object.keys(employeeMap).length} employees into memory.`);
  } else {
    console.log("[Users] No employees found on the device.");
  }
}

// 2. Function to Fetch Logs and Attach Names
// async function syncLogs() {
//   const targetUrl = `${DEVICE_CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

//   // Creates a clean date string like "2026-02-23T00:00:00+00:00" for Hikvision
//   const todayClean = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('.')[0] + '+00:00';
//   const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString().split('.')[0] + '+00:00';

//   let position = 0;
//   const maxResults = 30; // Fetch in batches
//   let allLogs = [];

//   try {
//     while (true) {
//       const payload = {
//         AcsEventCond: {
//           searchID: "1", searchResultPosition: position, maxResults: maxResults, major: 5, minor: 38,
//           startTime: todayClean,
//           endTime: todayEnd
//         }
//       };

//       const { data, res } = await request(targetUrl, {
//         method: 'POST',
//         digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
//         data: payload,
//         contentType: 'json', dataType: 'json', timeout: 10000
//       });

//       if (res.status === 200 && data.AcsEvent && data.AcsEvent.InfoList) {
//         const rawLogs = data.AcsEvent.InfoList;
//         allLogs.push(...rawLogs);

//         if (rawLogs.length < maxResults) {
//           break; // Final page
//         }
//         position += maxResults; // Prepare to fetch the next page
//       } else {
//         break;
//       }
//     }

//     if (allLogs.length > 0) {
//       // Map the names to the logs!
//       const enrichedLogs = allLogs.map(log => {
//         const empId = log.employeeNoString;
//         return {
//           id: empId,
//           // Look up the name in our map. If not found, use "Unknown"
//           name: employeeMap[empId] || "Unknown",
//           time: log.time,
//           // major 5 & minor 75 usually means "Fingerprint Verification Success"
//           eventType: log.minor
//         };
//       });

//       console.log(`[Logs] Processed ${enrichedLogs.length} logs:`);
//       console.log(enrichedLogs); // Verify the names are there!

//       // Export to JSON file
//       try {
//         fs.writeFileSync('logs.json', JSON.stringify(enrichedLogs, null, 2));
//         console.log('[Logs] Successfully exported to logs.json');
//       } catch (err) {
//         console.error('[Logs] Error writing to logs.json:', err.message);
//       }

//       // TODO: Push enrichedLogs to AWS Lightsail
//     }
//   } catch (error) {
//     console.error("[Logs] Connection error:", error.message);
//   }
// }

async function syncLogs() {
  const targetUrl = `${DEVICE_CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

  // Creates a clean date string like "2026-02-24T00:00:00+00:00" for Hikvision
  const todayClean = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('.')[0] + '+00:00';
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString().split('.')[0] + '+00:00';

  let currentPosition = 0;
  let keepFetching = true;
  let allRawLogs = []; // Array to hold all logs as we loop

  console.log("[Logs] Starting log sync...");

  while (keepFetching) {
    const payload = {
      AcsEventCond: {
        searchID: "1",
        searchResultPosition: currentPosition, // This moves forward every loop
        maxResults: 30, // Fetch in batches of 30
        major: 5,
        minor: 38,
        startTime: todayClean,
        endTime: todayEnd
      }
    };

    try {
      const { data, res } = await request(targetUrl, {
        method: 'POST',
        digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
        data: payload,
        contentType: 'json',
        dataType: 'json',
        timeout: 10000
      });

      if (res.status === 200 && data.AcsEvent) {
        const matches = data.AcsEvent.numOfMatches || 0;
        const logs = data.AcsEvent.InfoList || [];

        if (matches > 0 && logs.length > 0) {
          // Add this batch to our main array
          allRawLogs.push(...logs);
          console.log(`[Logs] Fetched ${logs.length} logs at position ${currentPosition}...`);

          // Move the position forward for the next loop
          currentPosition += logs.length;
        } else {
          // If 0 matches are returned, we reached the end of the logs!
          keepFetching = false;
        }
      } else {
        console.error(`[Logs] Device returned error status: ${res.status}`);
        keepFetching = false;
      }
    } catch (error) {
      console.error("[Logs] Connection error during sync:", error.message);
      keepFetching = false; // Stop the loop if the device disconnects
    }
  }

  // Once the loop finishes, process all the logs we collected
  if (allRawLogs.length > 0) {
    // Map the names to the logs!
    const enrichedLogs = allRawLogs.map(log => {
      const empId = log.employeeNoString;
      return {
        id: empId,
        name: employeeMap[empId] || "Unknown",
        time: log.time,
        eventType: log.minor
      };
    });

    console.log(`✅ [Logs] Finished! Processed a total of ${enrichedLogs.length} logs for today.`);
    // console.log(enrichedLogs); // You can uncomment this if you want to see the massive list

    // TODO: Push enrichedLogs to AWS Lightsail

  } else {
    console.log("[Logs] No logs found for today.");
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
  // setInterval(updateEmployeeMap, 3600000);
}

startAgent();