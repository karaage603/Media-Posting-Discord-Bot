require('dotenv').config();
const token = process.env.BOT_TOKEN;

// Require the necessary Discord.js classes
const { Client, Events, IntentsBitField } = require('discord.js');
let config = require('./config.json');

// Import other modules
const { handleCommand, checkIfMuted } = require('./commands');

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
  checkIfMuted(message);
  handleCommand(message); // Delegate message handling to command handler
});

// Log in to Discord with client token
client.login(token);