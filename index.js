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
