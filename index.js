import { Client, GatewayIntentBits, Partials, SlashCommandBuilder, REST, Routes, EmbedBuilder } from 'discord.js';
import translate from 'google-translate-api-x';

// ---------------- CONFIG ----------------
const TOKEN = process.env.DISCORD_TOKEN; // Make sure this is set in Render environment variables
const AUTO_TRANSLATE_TO = process.env.AUTO_TRANSLATE_TO || 'en';
const AUTO_TRANSLATE_CHANNELS = []; // Leave empty for all channels

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN is not set in environment variables.');
  process.exit(1);
}

// ---------------- CLIENT ----------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel]
});

// ---------------- SLASH COMMANDS ----------------
const commands = [
  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text to a specified language')
    .addStringOption(option =>
      option.setName('text')
            .setDescription('Text to translate')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('lang')
            .setDescription('Target language (en, bn, fr, etc.)')
            .setRequired(false))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await client.login(TOKEN); // Login before registering slash commands
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('❌ Error registering commands:', err);
  }
})();

// ---------------- BOT READY ----------------
client.once('ready', () => {
  console.log(`✅ Ling bot ready! Logged in as ${client.user.tag}`);
});

// ---------------- AUTO-TRANSLATE ----------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (AUTO_TRANSLATE_CHANNELS.length && !AUTO_TRANSLATE_CHANNELS.includes(message.channel.id)) return;

  try {
    const res = await translate(message.content, { to: AUTO_TRANSLATE_TO });
    if (res.text && res.text !== message.content) {
      const embed = new EmbedBuilder()
        .setColor(0x1ABC9C)
        .setAuthor({ name: `Auto-Translation (${AUTO_TRANSLATE_TO})` })
        .setDescription(`**Original:** ${message.content}\n**Translated:** ${res.text}`);
      await message.channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('❌ Translation error:', err);
  }
});

// ---------------- SLASH COMMAND ----------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== 'translate') return;

  const text = interaction.options.getString('text');
  const lang = interaction.options.getString('lang') || AUTO_TRANSLATE_TO;

  try {
    const res = await translate(text, { to: lang });
    const embed = new EmbedBuilder()
      .setColor(0x7289DA)
      .setAuthor({ name: `Translation (${lang})` })
      .setDescription(`**Original:** ${text}\n**Translated:** ${res.text}`);
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('❌ Translation error:', err);
    await interaction.reply('❌ Error translating text.');
  }
});


  
