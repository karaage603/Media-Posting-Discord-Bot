require('dotenv').config();
const token = process.env.BOT_TOKEN;

// Require the necessary Discord.js classes
const { Client, Events, IntentsBitField } = require('discord.js');

// Import other modules
const { handleCommand } = require('./commands');
// const { saveStatsToFile } = require('./statsManager');

// Create a new client instance
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on('error', (error) => {
  console.error('Bot encountered an error:', error);
});

// Handle messages
client.on('messageCreate', (message) => {
  handleCommand(client, message); // Delegate message handling to command handler
});

// Log in to Discord with client token
client.login(token);