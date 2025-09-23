const { Client, GatewayIntentBits } = require("discord.js");
const { translate } = require("@vitalets/google-translate-api");
const express = require("express");

// ===== Express server for Render & uptime =====
const app = express();

// Root shows bot status
app.get("/", (req, res) => {
  if (client.user) {
    res.send(`✅ Bot is online as ${client.user.tag}`);
  } else {
    res.send("⚠️ Bot is starting...");
  }
});

// Health check for uptime monitors
app.get("/health", (req, res) => res.send("OK"));

// Start Express server
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

const targetLang = "en"; // 🌍 Change to "bn", "fr", "hi", etc.

// Throttle map to prevent TooManyRequests
const pending = new Map(); // Map<userId, boolean>

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Throttle per user: 1 message per 2 seconds
  if (pending.has(message.author.id)) return;
  pending.set(message.author.id, true);
  setTimeout(() => pending.delete(message.author.id), 2000);

  try {
    const res = await translate(message.content, { to: targetLang });

    // Skip if translation equals input
    if (res.text.toLowerCase() === message.content.toLowerCase()) return;

    await message.reply(
      `🌐 **Translated (${res.from.language.iso} → ${targetLang}):** ${res.text}`
    );
  } catch (err) {
    console.error("Translation error:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
