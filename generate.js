const fs = require("fs");

const employees = [
    { id: "1201", name: "Loudovina Niquice" },
    { id: "1238", name: "Roberto Luis" },
    { id: "1237", name: "Carlos Manuel" },
    { id: "1208", name: "Ismenia Salgado" },
    { id: "1229", name: "Simao Afonso" },
    { id: "1213", name: "Marla Macamo" },
    { id: "1242", name: "Patricia Madivadua" },
    { id: "1228", name: "Gracinda Joaquim" },
    { id: "1217", name: "Ana Langa" },
    { id: "1223", name: "Nunes Miguel" },
    { id: "1224", name: "Heldeq Xerinda" },
    { id: "1211", name: "Hassina Assane" },
    { id: "1235", name: "Marcia Machanguana" },
    { id: "1241", name: "Shelsia Nhassengo" },
    { id: "1240", name: "Shanaya Mamade" },
    { id: "1209", name: "Kempha Jovo" },
    { id: "1231", name: "Balbina" },
    { id: "1234", name: "Ana Sheila" },
    { id: "1212", name: "Monica Caluzi" },
    { id: "1215", name: "Sheila Omar" },
    { id: "1227", name: "Palmira Nhatumbo" },
    { id: "1233", name: "Laurinda Guelele" }
];

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isWeekday(date) {
    const d = date.getDay();
    return d !== 0 && d !== 6;
}

function makeTime(date, hour, minute) {
    const d = new Date(date);
    d.setHours(hour, minute, random(0, 59));
    return d.toISOString().replace("Z", "+02:00");
}

function generateCheckIn(date) {
    const behavior = random(1, 100);

    // 60% on time (07:45–08:15)
    if (behavior <= 60) {
        const hour = random(7, 8);
        const minute = hour === 7 ? random(45, 59) : random(0, 15);
        return makeTime(date, hour, minute);
    }

    // 25% late (after 08:15)
    if (behavior <= 85) {
        return makeTime(date, 8, random(16, 59));
    }

    // 15% very early (before 07:45)
    return makeTime(date, 7, random(0, 44));
}

function generateCheckOut(date) {
    const behavior = random(1, 100);

    // 60% normal checkout around 17:00
    if (behavior <= 60) {
        return makeTime(date, 17, random(0, 20));
    }

    // 20% early checkout
    if (behavior <= 80) {
        return makeTime(date, 16, random(0, 59));
    }

    // 20% overtime
    return makeTime(date, 18, random(0, 30));
}

const logs = [];

const start = new Date("2026-02-01");
const end = new Date("2026-02-24");

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!isWeekday(d)) continue;

    for (const emp of employees) {
        const checkIn = generateCheckIn(d);
        logs.push({ ...emp, time: checkIn, eventType: 38 });

        // 10% missing checkout
        if (random(1, 100) <= 10) continue;

        // optional middle punch
        if (random(1, 100) > 65) {
            const mid = makeTime(d, 12, random(0, 59));
            logs.push({ ...emp, time: mid, eventType: 38 });
        }

        const checkOut = generateCheckOut(d);
        logs.push({ ...emp, time: checkOut, eventType: 38 });
    }
}

fs.writeFileSync("attendance_feb_2026.json", JSON.stringify(logs, null, 2));
console.log("Dataset generated:", logs.length, "records");