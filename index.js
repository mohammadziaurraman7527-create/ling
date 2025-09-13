import { Client, GatewayIntentBits, Partials } from "discord.js";
import express from "express";
import translate from "@vitalets/google-translate-api";

// ✅ Express server for uptime
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("✅ Ling Bot is running!"));
app.listen(PORT, () => console.log(`🌍 Server online on port ${PORT}`));

// ✅ Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const TOKEN = process.env.TOKEN;

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ✅ Top 10 languages
const supportedLanguages = {
  zh: "Chinese",
  es: "Spanish",
  hi: "Hindi",
  ar: "Arabic",
  bn: "Bengali",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  de: "German",
  fr: "French"
};

// ✅ Listen for messages
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const res = await translate(message.content, { to: "en" });

    // Only handle if the detected language is in top 10
    if (supportedLanguages[res.from.language.iso]) {
      await message.reply(
        `🌐 **${supportedLanguages[res.from.language.iso]} → English**:\n${res.text}`
      );
    }
  } catch (err) {
    console.error("❌ Translation error:", err);
  }
});

client.login(TOKEN);
