const { returnFile, uploadCommand, renameCommand, deleteCommand, listMediaCommand } = require('./fileManager');
const { listClubs, joinClub, pingClub } = require('./clubs');

// Command Prefix
const commandPrefix = "dz";

// Handle incoming commands
function handleCommand(client, message) {
  if (message.author.bot || !message.content.startsWith(commandPrefix)) return;

  const args = message.content.split(' ');
  const botCommand = args[1]?.toLowerCase();
    console.log(botCommand)
  switch (botCommand) {
    case "help":
      message.reply(getHelpMessage());
      break;
    case "list":
      listMediaCommand(message);
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
    case "clublist":
      listClubs(message);
      break;
    case "join":
      const clubName = args[2];
      joinClub(message, clubName);
      break;
    case "club":
      const clubToPing = args[2];
      pingClub(message, clubToPing);
      break;
    default:
      returnFile(message, args[1]);  
      break;
  }
}

// Help message function
function getHelpMessage() {
  return `What do you need help with?
  These are the available commands I have:
  \`\`\`
  Help:    \t\tdz help
  Media list:\t  dz list
  Post media:\t  dz [media name]
  
  **MOD ONLY**
  Upload media:\tdz upload [attachment]
  Rename media:\tdz rename [old name] [new name]
  \`\`\``;
}

module.exports = { handleCommand };