require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus
} = require("@discordjs/voice");

// 🔐 ENV
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const ALLOWED_ROLES = process.env.ALLOWED_ROLE_ID?.split(",") || [];

// ❗ VALIDASI
if (!TOKEN) {
  console.log("❌ TOKEN tidak ditemukan di Railway!");
  process.exit(1);
}

if (!GUILD_ID || !VOICE_CHANNEL_ID) {
  console.log("❌ GUILD_ID / VOICE_CHANNEL_ID belum diisi!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "e";

let connection;

// 🔥 CONNECT VC
async function connectToVC() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.log("❌ Guild tidak ditemukan");

    connection = joinVoiceChannel({
      channelId: VOICE_CHANNEL_ID,
      guildId: GUILD_ID,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: false
    });

    console.log("✅ Bot masuk voice channel");

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log("⚠️ Disconnect, reconnect...");
      setTimeout(connectToVC, 3000);
    });

  } catch (err) {
    console.log("❌ Error:", err);
    setTimeout(connectToVC, 5000);
  }
}

// 🚀 READY
client.on("ready", () => {
  console.log(`🔥 Login sebagai ${client.user.tag}`);

  setTimeout(() => {
    connectToVC();
  }, 5000);
});

// 🎮 COMMAND HANDLER
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.toLowerCase().startsWith(PREFIX)) return;

  // 🔒 CEK ROLE
  const hasAccess = msg.member.roles.cache.some(role =>
    ALLOWED_ROLES.includes(role.id)
  );

  if (!hasAccess) {
    return msg.reply("❌ Lu ga punya akses buat command ini!");
  }

  const withoutPrefix = msg.content.slice(PREFIX.length).trim();
  const args = withoutPrefix.split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  if (cmd === "join") {
    connectToVC();
    msg.reply("✅ Bot masuk VC!");
  }

  if (cmd === "leave") {
    const conn = getVoiceConnection(GUILD_ID);
    if (conn) {
      conn.destroy();
      msg.reply("👋 Bot keluar VC!");
    } else {
      msg.reply("❌ Bot tidak ada di VC");
    }
  }

  if (cmd === "ping") {
    msg.reply("🏓 Pong!");
  }
});

// 🔐 LOGIN
client.login(TOKEN);
