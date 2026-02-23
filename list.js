const { request } = require('urllib');

// CONFIGURATION
const DEVICE_CONFIG = {
  ip: 'http://192.0.0.64', // Replace with your Device IP
  user: 'admin',
  pass: '!Palma12345678'  // Replace with your password
};

async function listEmployees() {
  console.log("Fetching employee list from Hikvision device...");

  // The endpoint for searching Users instead of Events
  const targetUrl = `${DEVICE_CONFIG.ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;

  const payload = {
    UserInfoSearchCond: {
      searchID: "1",
      searchResultPosition: 0,
      maxResults: 1000 // Grabs up to 1000 users at once
    }
  };

  try {
    const { data, res } = await request(targetUrl, {
      method: 'POST',
      digestAuth: `${DEVICE_CONFIG.user}:${DEVICE_CONFIG.pass}`,
      data: payload,
      contentType: 'json',
      dataType: 'json', // Automatically parses the JSON response
      timeout: 10000
    });

    if (res.status !== 200) {
      console.error(`Device returned error: ${res.status}`);
      console.error("Raw response:", data);
      return;
    }

    // Extract the user list from the JSON response
    const userList = data.UserInfoSearch.UserInfo || [];

    if (userList.length > 0) {
      console.log(`\n✅ Successfully found ${userList.length} employees:\n`);

      // Loop through and print just the ID and Name for a clean look
      userList.forEach(user => {
        console.log(`ID: ${user.employeeNo} | Name: ${user.name}`);
      });

      // Show the raw JSON for the first user so you can see all available fields
      console.log("\n--- Example Raw Data (First User) ---");
      console.log(userList[0]);

    } else {
      console.log("No employees found on the device.");
    }

  } catch (error) {
    console.error("Connection error:", error.message);
  }
}

// Run the function
listEmployees();