const fm = require('./filemanager');
const club = require('./clubs');
let config = require('./config.json');

// Checking if a user has been muted by mods
function checkIfMuted(message) {
  const regex = /(?:muted|silenced).*(?:for now|temporarily|permanently).*Reason:/i;
  if (message.author.id == config.MODERATION_BOT_ID && regex.test(message)) {
    fm.returnFile(message, config.MediaForMutedUsers, true); //
  }
}

// Handle incoming commands
function handleCommand(message) {

  if (message.author.bot || !message.content.startsWith(config.commandPrefix)) return;

  // Remove the prefix and split the command and its arguments
  const args = message.content.slice(config.commandPrefix.length).trim().split(/ +/);
  const botCommand = args[0]?.toLowerCase();

  switch (botCommand) {
    case "help":
      message.channel.send(getHelpMessage());
      break;
    case "list":
      fm.listMediaCommand(message);
      break;
    case "upload":
      fm.uploadCommand(message, args);
      break;
    case "rename":
      fm.renameCommand(message, args);
      break;
    case "delete":
      fm.deleteCommand(message, args);
      break;
    case "create":
      club.createClub(message, args);
    case "clublist":
      club.listClubs(message);
      break;
    case "join":
      const clubName = args[2];
      club.joinClub(message, clubName);
      break;
    case "ping":
      const clubToPing = args[2];
      club.pingClub(message, clubToPing);
      break;
    case "setid":
      fm.setModBotID(message, args);
      break;
    case "setmutemedia":
      fm.setMuteMedia(message, args);
      break;
    default:
      fm.returnFile(message, args);
      break;
  }
}

// Help message function
function getHelpMessage() {
  return `These are the available commands I have:
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

module.exports = { handleCommand, checkIfMuted };