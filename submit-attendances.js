const fs = require('fs');
const { request } = require('urllib');

// API Configuration
const API_URL = 'https://crbbbvzxhfxzlqcnygdz.supabase.co/functions/v1/fingerprint-webhook?key=20ae39aed8b84283c7740d91429e5d91736945b73a09b66c63704dce1d1b8639'; // Adjust API URL as needed

async function submitAttendances() {
    console.log('[Submit] Starting attendance submission...');

    try {
        // 1. Read the enriched logs from logs.json
        if (!fs.existsSync('logs.json')) {
            console.error('[Submit] logs.json not found! Please run the events-users.js sync first.');
            return;
        }

        const rawData = fs.readFileSync('logs.json', 'utf8');
        const logs = JSON.parse(rawData);

        if (logs.length === 0) {
            console.log('[Submit] No logs found in logs.json to submit.');
            return;
        }

        console.log(`[Submit] Loaded ${logs.length} logs from logs.json.`);

        // 2. Prepare payload to match API expectations
        // Here we can wrap it or send it directly. Modify as needed
        const payload = {
            logs: logs
        };

        // 3. Post to the API
        console.log(`[Submit] Sending POST request to ${API_URL}...`);

        const { data, res } = await request(API_URL, {
            method: 'POST',
            data: payload,
            contentType: 'json',
            dataType: 'json',
            timeout: 10000
        });

        if (res.status >= 200 && res.status < 300) {
            console.log(`✅ [Submit] Successfully submitted ${logs.length} logs!`);
            if (data) console.log('[Submit] API Response:', data);
        } else {
            console.error(`[Submit] Final submission failed with status ${res.status}`);
            if (data) console.error('[Submit] API Error Response:', data);
        }

    } catch (error) {
        console.error('[Submit] Connection or Parsing Error:', error.message);
    }
}

// Run the submission
submitAttendances();
