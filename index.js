const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// 👑 ADMINS
const ADMINS = [
    "1254449388407754964",
    "405339262813470723"
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 📦 DB
const dbPath = path.join(__dirname, "coins.json");

let db = {};

function loadDB() {
    try {
        db = fs.existsSync(dbPath)
            ? JSON.parse(fs.readFileSync(dbPath, "utf8"))
            : {};
    } catch {
        db = {};
    }
}

function saveDB() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

loadDB();

// 🧠 USER
function getUser(id) {
    if (!db[id]) {
        db[id] = {
            coins: 1000,
            xp: 0,
            level: 1
        };
    }
    return db[id];
}

// 📈 LEVEL
function addXP(id, amount) {
    let u = getUser(id);

    u.xp += amount;

    if (u.xp >= u.level * 100) {
        u.level++;
        u.xp = 0;
    }

    saveDB();
}

let games = {};

// 🤖 READY
client.on("ready", () => {
    console.log("Vescoin Bot Aktif!");
});

// 💬 MESSAGE
client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    let u = getUser(message.author.id);

    // 💰 BAKİYE
    if (message.content === ".bakiye") {
        return message.reply(`💰 ${u.coins} coin | ⭐ Level ${u.level} | XP ${u.xp}`);
    }

    // 👑 COINVER
    if (args[0] === ".coinver") {
        if (!ADMINS.includes(message.author.id)) return;

        const target = message.mentions.users.first();
        const amount = Number(args[2]);

        if (!target || !amount) return;

        getUser(target.id).coins += amount;
        saveDB();

        return message.reply("👑 coin verildi");
    }

    // 📤 GÖNDER
    if (args[0] === ".gönder") {
        const target = message.mentions.users.first();
        const amount = Number(args[2]);

        if (!target || !amount) return;

        if (u.level < 5) return message.reply("level 5 lazım");

        if (u.coins < amount) return message.reply("yetersiz coin");

        u.coins -= amount;
        getUser(target.id).coins += amount;

        saveDB();
        return message.reply("gönderildi");
    }

    // ✂️ TKM (TEK SİSTEM - ESKİ SİLİNDİ)
    if (args[0] === ".tkm") {

        const bet = Number(args[1]);
        const choice = (args[2] || "").toLowerCase();

        const options = ["taş", "kağıt", "makas"];

        // ❗ TEK KULLANIM ŞEKLİ
        if (!bet || !choice) {
            return message.reply("❌ Kullanım: .tkm 50 taş");
        }

        if (!options.includes(choice)) {
            return message.reply("❌ taş / kağıt / makas");
        }

        if (u.coins < bet) {
            return message.reply("❌ yetersiz coin");
        }

        const bot = options[Math.floor(Math.random() * 3)];

        if (choice === bot) {
            return message.reply(`🤝 Berabere! Ben ${bot}`);
        }

        const win =
            (choice === "taş" && bot === "makas") ||
            (choice === "kağıt" && bot === "taş") ||
            (choice === "makas" && bot === "kağıt");

        if (win) {
            u.coins += bet;
            addXP(message.author.id, 10);
        } else {
            u.coins -= bet;
        }

        saveDB();

        return message.reply(`🎮 Ben ${bot} seçtim`);
    }
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
