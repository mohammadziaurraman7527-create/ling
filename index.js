const { Client, GatewayIntentBits } = require("discord.js");
const translate = require("@vitalets/google-translate-api");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const supportedLangs = require("@vitalets/google-translate-api/languages");
const serverLangs = {}; // { guildId: langCode }

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const guildId = message.guild ? message.guild.id : null;

  // Command to set server language
  if (message.content.startsWith("!setlang")) {
    const args = message.content.split(" ");
    const lang = args[1];

    if (!lang || !supportedLangs.isSupported(lang)) {
      return message.reply("⚠ Usage: `!setlang <lang_code>`\nExample: `!setlang en`");
    }

    if (guildId) {
      serverLangs[guildId] = lang;
      return message.reply(`✅ Auto-translate language for this server set to **${lang}**`);
    } else {
      return message.reply("❌ Cannot set language in DMs.");
    }
  }

  // Command: list supported languages
  if (message.content === "!langs") {
    const langList = Object.keys(supportedLangs.codes).join(", ");
    return message.reply(
      `🌍 Supported languages (${Object.keys(supportedLangs.codes).length}):\n${langList}`
    );
  }

  // Auto-translate all messages
  try {
    const targetLang = guildId && serverLangs[guildId] ? serverLangs[guildId] : "en";

    // Auto-detect source language
    const res = await translate(message.content, { to: targetLang });
    
    if (res.text && res.text !== message.content) {
      message.reply(`🌍 **${targetLang.toUpperCase()}:** ${res.text}`);
    }
  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.DISCORD_TOKEN);


  
