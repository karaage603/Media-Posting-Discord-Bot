// Require the necessary Discord.js classes
const { Client, Events, GatewayIntentBits, IntentsBitField, SlashCommandAssertions, SlashCommandBuilder } = require('discord.js');

// Require other modules
const fs = require('fs');
const https = require('https');
const path = require('path');
const { token } = require('./config.json');
const statsFilePath = './fileRequestStats.json';

// Define variables
const mediaFolder = './media'; // Folder containing saved/uploaded media
const commandPrefix = "dz"; // Command prefix
let fileList = []; // List of files
let fileListNoExt = []; // List of files without extensions
let fileRequestCount = {};

// Acquire list of files in media folder
if (fs.existsSync(mediaFolder)) {
  fileList = fs.readdirSync(mediaFolder);
  fileListNoExt = fileList.map(file => path.parse(file).name.toLowerCase());
}

// Load existing statistics from the file
if (fs.existsSync(statsFilePath)) {
  const statsFileContent = fs.readFileSync(statsFilePath, 'utf-8');
  fileRequestCount = JSON.parse(statsFileContent);
}

// Create a new client instance
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
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


client.on('messageCreate', (message) => {

  // Ignore messages from bots and messages without content
  if (message.author.bot || !message.content.startsWith(commandPrefix)) {
    return;
  }

  const args = message.content.split(' ');
  const botCommand = args[1]?.toLowerCase();
  const mediaIdx = fileListNoExt.indexOf(botCommand);
  const mediaName = mediaIdx > -1 ? fileList[mediaIdx] : null;

  // Update file request count
  if (mediaName) {
    fileRequestCount[mediaName]++;
    const statsFileContent = JSON.stringify(fileRequestCount, null, 2);
    fs.writeFileSync(statsFilePath, statsFileContent, 'utf-8');
  }

  const ping = new SlashCommandBuilder()
      .setName('list')
      .setDescription('test list');
  client.application.commands.create(ping);

  switch (botCommand) {
    case "help":
      message.reply(`What do you need help with?\nThese are the available commands I have:\n\`\`\`Help:    \t\tdz help\nMedia list:\t  dz list\nPost media:\t  dz [media name]\n\n**MOD ONLY**\nUpload media:\tdz upload [attachment]\nRename media:\tdz rename [old name] [new name]\`\`\``);
      break;

    case "list":
      message.reply(`These are the available media:\n${fileListNoExt.join('\n')}`);
      break;

    case "upload":
      uploadCommand(message, args);
      break;

    case "rename":
      renameCommand(message, args);
      break;

    case "delete":
      deleteCommand(message, args);
      break;
    case "stats":
      showStatsCommand(message);
      break;
    default:
      if (mediaName) message.reply({ files: [`${mediaFolder}/${mediaName}`] });
      break;
  }

});

client.on('interactionCreate', (interaction) => {
  if(!interaction.isChatInputCommand()) return;
  if(interaction.commandName==='list'){
    interaction.reply({content:`These are the available media:\n${fileListNoExt.join('\n')}`, ephemeral: true})
  }
})

function uploadCommand(message, args) {
  const userPreferredName = args[2]?.toLowerCase();
  if (!userPreferredName || message.author.bot || message.attachments.size === 0) {
    message.reply("Please specify a valid name and provide an attachment");
    return;
  }

  const attachment = message.attachments.first();
  const newFileName = `${userPreferredName}${path.extname(attachment.name)}`;
  const newFilePath = path.join(mediaFolder, newFileName);

  if (!fs.existsSync(mediaFolder)) {
    fs.mkdirSync(mediaFolder);
  }

  // Check if the file already exists
  if (fs.existsSync(newFilePath)) {
    message.reply(`${newFileName} already exists. Please choose a different name.`);
    return;
  }

  const file = fs.createWriteStream(newFilePath);
  https.get(attachment.url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Saved ${attachment.name} from ${message.author.tag}`);

      updateFileList();
      message.reply(`Media saved as: ${newFilePath}`);
    });
  });
}

function renameCommand(message, args) {
  const oldName = args[2]?.toLowerCase();
  const newName = args[3]?.toLowerCase();

  if (!oldName || !newName) {
    message.reply("Please provide both the old and new names for renaming.");
    return;
  }
  
  const oldIdx = fileListNoExt.indexOf(oldName);
  if (oldIdx > -1) {
    const oldFile = fileList[oldIdx];
    const newFile = `${newName}${path.extname(oldFile)}`;
    const oldFilePath = path.join(mediaFolder, oldFile);
    const newFilePath = path.join(mediaFolder, newFile);

    // Check if the new file name already exists
    if (fs.existsSync(newFilePath)) {
      message.reply(`${newFile} already exists. Please choose a different new name.`);
      return;
    }

    fs.renameSync(oldFilePath, newFilePath);

    updateFileList();
    message.reply(`File renamed from ${oldFile} to ${newFile}`);
  } else {
    message.reply(`File with the name ${oldName} not found.`);
  }
}

function deleteCommand(message, args) {
  const fileNameToDelete = args[2]?.toLowerCase();

  if (!fileNameToDelete) {
    message.reply("Please provide the name of the file you want to delete.");
    return;
  }

  const fileToDeleteIdx = fileListNoExt.indexOf(fileNameToDelete);
  const fileToDelete = fileToDeleteIdx > -1 ? fileList[fileToDeleteIdx] : null;

  if (!fileToDelete) {
    message.reply(`File with the name ${fileNameToDelete} not found.`);
    return;
  }

  // Confirmation prompt
  message.reply(`Are you sure you want to delete the file ${fileToDelete}? Type \`confirm\` to proceed.`);

  const filter = (response) => response.author.id === message.author.id && response.content.toLowerCase() === 'confirm';
  const collector = message.channel.createMessageCollector({ filter, time: 10000, max: 1 });

  collector.on('collect', () => {
    // User confirmed deletion
    const filePathToDelete = path.join(mediaFolder, fileToDelete);
    fs.unlinkSync(filePathToDelete);

    // Update fileListNoExt after deletion
    updateFileList();

    message.reply(`File ${fileToDelete} has been successfully deleted.`);
  });

  collector.on('end', (collected, reason) => {
    if (reason === 'time') {
      message.reply('Deletion confirmation timed out. No files were deleted.');
    }
  });
}

function updateFileList() {
  fileList = fs.readdirSync(mediaFolder);
  fileListNoExt = fileList.map(file => path.parse(file).name.toLowerCase());
  console.log("Updated fileListNoExt:", fileListNoExt);
  
  // Initialize or update file request count for new or existing files
  fileList.forEach(file => {
    if (!fileRequestCount[file]) {
      fileRequestCount[file] = 0;
    }
  });
}

function showStatsCommand(message) {
  const sortedStats = Object.entries(fileRequestCount)
    .sort(([, countA], [, countB]) => countB - countA); // Sort entries by count in descending order

  const statsMessage = sortedStats
    .map(([file, count]) => `${file}:${count}`)
    .join('\n');

  message.reply(`Statistics (All-time)\n\`\`\`${statsMessage}\`\`\``);
}

// Function to save file request statistics to the file
function saveStatsToFile() {
  const statsFileContent = JSON.stringify(fileRequestCount, null, 2);
  fs.writeFileSync(statsFilePath, statsFileContent, 'utf-8');
}

// Save statistics to the file periodically
setInterval(saveStatsToFile, 3600000);  // 1 hour interval

// Log in to Discord with client token
client.login(token);
