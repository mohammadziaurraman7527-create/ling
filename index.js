const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const express = require("express");
const fetch = require("node-fetch");
const googleTranslate = require("@vitalets/google-translate-api");

// ===== Express server for Render uptime =====
const app = express();
app.get("/", (req, res) => res.send(client.user ? `✅ Bot online as ${client.user.tag}` : "⚠️ Starting..."));
app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🌍 Web server running on port ${PORT}`));

// ===== Discord Bot =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ===== Server languages (default English) =====
const serverLangs = new Map();
const defaultLang = "en";

// ===== Slash commands =====
const commands = [
  new SlashCommandBuilder()
    .setName("setlang")
    .setDescription("Set translation language for this server")
    .addStringOption(opt => opt.setName("language").setDescription("Language code, e.g., bn, fr").setRequired(true)),
  new SlashCommandBuilder()
    .setName("getlang")
    .setDescription("Show current translation language for this server"),
  new SlashCommandBuilder()
    .setName("transchain")
    .setDescription("Garbles your message through multiple random translations")
    .addStringOption(opt => opt.setName("text").setDescription("Message").setRequired(true))
    .addIntegerOption(opt => opt.setName("times").setDescription("Number of translations").setRequired(true)),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
});

// ===== Translation functions =====
async function translateLibre(text, target = "en") {
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target,
        format: "text"
      })
    });
    const data = await res.json();
    return data.translatedText;
  } catch (err) {
    console.error("LibreTranslate failed:", err.message);
    throw err;
  }
}

async function translateCombined(text, target = "en") {
  try {
    const libre = await translateLibre(text, target);
    return libre;
  } catch {
    try {
      const google = await googleTranslate(text, { to: target });
      return google.text;
    } catch (err) {
      console.error("Google Translate failed:", err.message);
      return null;
    }
  }
}

// ===== Random language list for translation chain =====
const languages = [
  "en","fr","es","de","it","ja","ko","zh-Hans","ru","ar","pt","hi","bn","tr","vi","pl","nl","sv"
];

// ===== Message listener (auto-translate) =====
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const targetLang = serverLangs.get(message.guild.id) || defaultLang;

  try {
    const translated = await translateCombined(message.content, targetLang);
    if (translated && translated.toLowerCase() !== message.content.toLowerCase()) {
      await message.reply(`🌐 Translated (${targetLang}): ${translated}`);
    }
  } catch (err) {
    console.error("Translation error:", err.message);
  }
});

// ===== Sleep function for throttling =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    await interaction.reply(`🌐 Current translation language: **${lang}**`);
  } else if (commandName === "transchain") {
    let text = interaction.options.getString("text");
    let times = interaction.options.getInteger("times");

    if (times > 100) times = 100; // safety limit
    await interaction.reply(`⏳ Garbling your message through ${times} translations...`);

    try {
      for (let i = 0; i < times; i++) {
        const randomLang = languages[Math.floor(Math.random() * languages.length)];
        text = await translateCombined(text, randomLang);
        await sleep(500); // small delay to avoid hitting Google rate limits
      }
      const finalLang = serverLangs.get(interaction.guild.id) || defaultLang;
      text = await translateCombined(text, finalLang);

      await interaction.followUp(`🌀 Translation chain result:\n${text}`);
    } catch (err) {
      console.error("Translation chain error:", err.message);
      await interaction.followUp("⚠️ Error occurred during translation chain.");
    }
  }
});

// ===== Final login =====
client.login(process.env.DISCORD_TOKEN);
