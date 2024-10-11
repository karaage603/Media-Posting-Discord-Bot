let clubs = {};

// List all available clubs
function listClubs(message) {
  const clubNames = Object.keys(clubs);
  if (clubNames.length === 0) {
    message.reply("There are currently no clubs available.");
    return;
  }
  const clubList = clubNames.map(clubName => {
    const memberCount = clubs[clubName].length;
    return `${clubName}: ${memberCount} member(s)`;
  }).join('\n');
  message.reply(`Available clubs:\n\`\`\`${clubList}\`\`\``);
}

// Join a club
function joinClub(message, clubName) {
  if (!clubName) {
    message.reply("Please specify a club name.");
    return;
  }
  const userId = message.author.id;
  if (!clubs[clubName]) {
    clubs[clubName] = [];
  }
  if (clubs[clubName].includes(userId)) {
    message.reply(`You are already a member of ${clubName} club.`);
  } else {
    clubs[clubName].push(userId);
    message.reply(`You have joined the ${clubName} club.`);
  }
}

// Ping a club
function pingClub(message, clubName) {
  if (!clubs[clubName]) {
    message.reply(`${clubName} doesn't exist.`);
    return;
  }
  const clubMembers = clubs[clubName].map(id => `<@${id}>`).join(', ');
  message.channel.send(`Pinging ${clubName} club members: ${clubMembers}`);
}

module.exports = { listClubs, joinClub, pingClub };