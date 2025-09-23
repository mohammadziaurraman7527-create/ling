const { Client, GatewayIntentBits } = require("discord.js");
const translate = require("@vitalets/google-translate-api");

// Load bot token from environment (Render → Environment tab → DISCORD_TOKEN)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const targetLang = "en"; // 🌍 Change this to whatever language you want

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  try {
    const res = await translate(message.content, { to: targetLang });

    // If translation is the same as input, skip
    if (res.text.toLowerCase() === message.content.toLowerCase()) return;

    await message.reply(`🌐 **Translated (${res.from.language.iso} → ${targetLang}):** ${res.text}`);
  } catch (err) {
    console.error("Translation error:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
