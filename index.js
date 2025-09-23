const { Client, GatewayIntentBits } = require("discord.js");
const translate = require("@vitalets/google-translate-api");
const express = require("express");

// ===== Express server to keep Render alive =====
const app = express();

// Root shows bot status
app.get("/", (req, res) => {
  if (client.user) {
    res.send(`✅ Bot is online as ${client.user.tag}`);
  } else {
    res.send("⚠️ Bot is starting...");
  }
});

// Health check route for uptime services
app.get("/health", (req, res) => res.send("OK"));

// Start express server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🌍 Web service running on port ${PORT}`));

// ===== Discord Bot =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const targetLang = "en"; // 🌍 Change this to any language code (bn, fr, hi, ja, etc.)

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const res = await translate(message.content, { to: targetLang });

    if (res.text.toLowerCase() === message.content.toLowerCase()) return;

    await message.reply(
      `🌐 **Translated (${res.from.language.iso} → ${targetLang}):** ${res.text}`
    );
  } catch (err) {
    console.error("Translation error:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
