const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");

// 👑 ADMINS (2 ADMIN)
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

// 📦 DATABASE
let db = {};

if (fs.existsSync("./coins.json")) {
    try {
        db = JSON.parse(fs.readFileSync("./coins.json"));
    } catch {
        db = {};
    }
}

function saveDB() {
    fs.writeFileSync("./coins.json", JSON.stringify(db, null, 2));
}

// 🧠 USER SYSTEM
function getUser(id) {
    if (!db[id]) {
        db[id] = {
            coins: 1000,
            xp: 0,
            level: 1
        };
    }

    if (typeof db[id].coins !== "number") db[id].coins = 1000;
    if (typeof db[id].xp !== "number") db[id].xp = 0;
    if (typeof db[id].level !== "number") db[id].level = 1;

    return db[id];
}

// 📈 LEVEL SYSTEM
function addXP(id, amount) {
    let u = getUser(id);

    u.xp += amount;

    let need = u.level * 100;

    if (u.xp >= need) {
        u.level++;
        u.xp = 0;
    }

    saveDB();
}

// 🎮 ACTIVE GAMES
let games = {};

// 🤖 READY
client.on("ready", () => {
    console.log("✅ Vescoin Bot Aktif!");
});

// 💬 COMMANDS
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(" ");

    let u = getUser(message.author.id);

    // 💰 BAKİYE
    if (message.content === ".bakiye") {
        return message.reply(
            `💰 ${u.coins} Vescoin | ⭐ Level ${u.level} | XP ${u.xp}`
        );
    }

    // 💸 PARA GÖNDER (LEVEL 5)
    if (args[0] === ".gönder") {
        const target = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!target || !amount) {
            return message.reply("Kullanım: .gönder @kişi 100");
        }

        if (message.author.id === target.id) {
            return message.reply("❌ Kendine gönderemezsin!");
        }

        if (u.level < 5) {
            return message.reply("❌ Level 5 olmadan coin gönderemezsin!");
        }

        let receiver = getUser(target.id);

        if (u.coins < amount) {
            return message.reply("❌ Yetersiz coin!");
        }

        u.coins -= amount;
        receiver.coins += amount;

        saveDB();

        return message.reply(`💸 ${amount} Vescoin gönderildi!`);
    }

    // 👑 ADMIN COIN VER
    if (args[0] === ".coinver") {
        if (!ADMINS.includes(message.author.id)) {
            return message.reply("❌ Sadece admin!");
        }

        const target = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!target || !amount) {
            return message.reply("Kullanım: .coinver @kişi 1000");
        }

        let user = getUser(target.id);
        user.coins += amount;

        saveDB();

        return message.reply(`👑 ${amount} Vescoin verildi!`);
    }

    // 💣 MAYIN TARLASI
    if (args[0] === ".mayin") {
        const bet = parseInt(args[1]);

        if (!bet) {
            return message.reply("Kullanım: .mayin 50");
        }

        if (u.coins < bet) {
            return message.reply("❌ Yetersiz Vescoin!");
        }

        let mines = [];

        while (mines.length < 3) {
            let r = Math.floor(Math.random() * 9);
            if (!mines.includes(r)) mines.push(r);
        }

        games[message.author.id] = {
            bet,
            mines,
            picks: []
        };

        let rows = [];

        for (let i = 0; i < 3; i++) {
            let row = new ActionRowBuilder();

            for (let j = 0; j < 3; j++) {
                let id = i * 3 + j;

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mine_${id}`)
                        .setLabel("🟩")
                        .setStyle(ButtonStyle.Success)
                );
            }

            rows.push(row);
        }

        message.reply({
            content: "💣 Mayın Tarlası başladı! 3 kare seç!",
            components: rows
        });
    }
});

// 🧠 BUTTON SYSTEM
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (!interaction.customId.startsWith("mine_")) return;

    const index = parseInt(interaction.customId.split("_")[1]);

    let game = games[interaction.user.id];

    if (!game) {
        return interaction.reply({ content: "❌ Oyun yok!", ephemeral: true });
    }

    if (game.picks.includes(index)) {
        return interaction.reply({ content: "⚠️ Zaten seçtin!", ephemeral: true });
    }

    game.picks.push(index);

    let u = getUser(interaction.user.id);

    // 💣 MAYIN
    if (game.mines.includes(index)) {
        u.coins -= game.bet;

        addXP(interaction.user.id, 10);

        delete games[interaction.user.id];

        saveDB();

        return interaction.reply({
            content: "💣 Mayına bastın! Kaybettin ❌",
            ephemeral: true
        });
    }

    // 🟩 KAZANMA
    if (game.picks.length === 3) {
        u.coins += game.bet * 2;

        addXP(interaction.user.id, 25);

        delete games[interaction.user.id];

        saveDB();

        return interaction.reply({
            content: "🎉 Kazandın! 2x Vescoin 💰",
            ephemeral: true
        });
    }

    return interaction.reply({
        content: `✔ Seçim: ${game.picks.length}/3`,
        ephemeral: true
    });
});

// 🔑 BOT LOGIN
client.login(process.env.TOKEN);