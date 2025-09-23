const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const express = require("express");

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

// ===== Server languages (default to English) =====
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
    .setDescription("Show current translation language for this server")
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

// ===== Message listener =====
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const targetLang = serverLangs.get(message.guild.id) || defaultLang;
  const text = encodeURIComponent(message.content);
  const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${text}&op=translate`;

  await message.reply(`🌐 Click to translate: ${url}`);
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
    await interaction.reply(`🌐 Current translation language: **${lang}**`);
  }
});

client.login(process.env.DISCORD_TOKEN);


