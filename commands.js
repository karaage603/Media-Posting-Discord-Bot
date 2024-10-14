const { returnFile, uploadCommand, renameCommand, deleteCommand, listMediaCommand } = require('./filemanager');
const { listClubs, joinClub, pingClub } = require('./clubs');

// Command Prefix
const commandPrefix = ".";

// Handle incoming commands
function handleCommand(client, message) {
  if (message.author.bot || !message.content.startsWith(commandPrefix)) return;

  // Remove the prefix and split the command and its arguments
  const args = message.content.slice(commandPrefix.length).trim().split(/ +/);
  const botCommand = args[0]?.toLowerCase();
  
  switch (botCommand) {
    case "help":
      message.channel.send(getHelpMessage());
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
      returnFile(message, args[0]);  
      break;
  }
}

// Help message function
function getHelpMessage() {
  return `What do you need help with?
  These are the available commands I have:
  \`\`\`
  Help:    \t\t.help
  Media list:\t  .list
  Post media:\t  .[media name]
  
  **MOD ONLY**
  Upload media:\t.upload [media name] <attachment>
  Rename media:\t.rename [old name] [new name]
  Delete media:\t.delete [media name]
  \`\`\``;
}

module.exports = { handleCommand };
