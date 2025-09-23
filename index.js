const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { translate: googleTranslate } = require("@vitalets/google-translate-api");
const express = require("express");
const fetch = require("node-fetch");

// ===== Express server for Render & uptime =====
const app = express();

app.get("/", (req, res) => {
  if (client.user) {
    res.send(`✅ Bot is online as ${client.user.tag}`);
  } else {
    res.send("⚠️ Bot is starting...");
  }
});

app.get("/health", (req, res) => res.send("OK"));

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

const queue = [];
let isProcessing = false;

// Store server languages (guildId -> language code)
const serverLangs = new Map();
const defaultLang = "en";

// ===== Slash command registration =====
const commands = [
  new SlashCommandBuilder()
    .setName("setlang")
    .setDescription("Set the translation language for this server")
    .addStringOption((option) =>
      option.setName("language").setDescription("Language code (e.g., bn, fr, ja)").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("getlang")
    .setDescription("Show the current translation language for this server"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Register slash commands globally (can also be per-guild for faster update)
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
});

// ===== Translation processing queue =====
async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const { message } = queue.shift();
  const targetLang = serverLangs.get(message.guild.id) || defaultLang;

  try {
    let translation;

    // Try LibreTranslate first
    try {
      const res = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: message.content,
          source: "auto",
          target: targetLang,
          format: "text",
        }),
      });
      const data = await res.json();
      translation = data.translatedText;
    } catch {
      console.warn("LibreTranslate failed, falling back to Google Translate");
    }

    // Fallback to Google Translate
    if (!translation) {
      const res = await googleTranslate(message.content, { to: targetLang });
      translation = res.text;
    }

    if (translation.toLowerCase() !== message.content.toLowerCase()) {
      await message.reply(`🌐 **Translated (${targetLang}):** ${translation}`);
    }
  } catch (err) {
    console.error("Translation error:", err.message);
  }

  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 1000);
}

// ===== Message listener =====
client.on("messageCreate", (message) => {
  if (message.author.bot || !message.guild) return;

  queue.push({ message });
  processQueue();
});

// ===== Slash command listener =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "setlang") {
    const lang = interaction.options.getString("language").toLowerCase();
    serverLangs.set(interaction.guild.id, lang);
    await interaction.reply(`✅ Translation language set to **${lang}** for this server.`);
  } else if (commandName === "getlang") {
    const lang = serverLangs.get(interaction.guild.id) || defaultLang;
    await interaction.reply(`🌐 Current translation language for this server: **${lang}**`);
  }
});

client.login(process.env.DISCORD_TOKEN);

