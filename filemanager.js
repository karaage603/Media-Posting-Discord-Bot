const fs = require('fs');
const path = require('path');
const https = require('https');
const configPath = "./config.json"
let cfg = require(configPath);
const mediaFolder = './media';
let fileList = fs.existsSync(mediaFolder) ? fs.readdirSync(mediaFolder) : [];
let fileListNoExt = fileList.map(file => path.parse(file).name.toLowerCase());

// Return the media file
function returnFile(message, args, muteflag) {
    const mediaIdx = muteflag ? fileListNoExt.indexOf(args) : fileListNoExt.indexOf(args[0]);
    const mediaName = mediaIdx !== -1 ? fileList[mediaIdx] : null;

    if (mediaName) message.channel.send({ files: [`${mediaFolder}/${mediaName}`] });
    else message.channel.send("File not found");

    muteflag = false;
}

// Update the file list
function updateFileList() {

    fileList = fs.readdirSync(mediaFolder);
    fileListNoExt = fileList.map(file => path.parse(file).name.toLowerCase());

}

// List all media files
function listMediaCommand(message) {

    message.channel.send(`These are the available media:\n${fileListNoExt.join('\n')}`);

}

// Upload media file
function uploadCommand(message, args) {

    if (!hasPermission(message)) return;

    const userPreferredName = args[1]?.toLowerCase();

    if (!userPreferredName || message.author.bot || message.attachments.size === 0) {
        message.channel.send("Please specify a valid name and provide an attachment");
        return;
    }

    const attachment = message.attachments.first();
    const newFileName = `${userPreferredName}${path.extname(attachment.name)}`;
    const newFilePath = path.join(mediaFolder, newFileName);

    if (!fs.existsSync(mediaFolder)) {
        fs.mkdirSync(mediaFolder);
    }

    if (fs.existsSync(newFilePath)) {
        message.channel.send(`${newFileName} already exists. Please choose a different name.`);
        return;
    }

    const file = fs.createWriteStream(newFilePath);

    https.get(attachment.url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            updateFileList();
            message.channel.send(`Media saved as: ${newFilePath}`);
        });
    });
}

// Rename media file
function renameCommand(message, args) {

    if (!hasPermission(message)) return;

    // Check if both old name and new name are provided
    if (args.length < 3) {
        message.channel.send("Please specify both the old name and the new name.");
        return;
    }

    const oldName = args[1]?.toLowerCase();
    const newName = args[2]?.toLowerCase();
    const oldIdx = fileListNoExt.indexOf(oldName);

    if (oldIdx > -1) {
        const oldFile = fileList[oldIdx];
        const newFile = `${newName}${path.extname(oldFile)}`;
        const oldFilePath = path.join(mediaFolder, oldFile);
        const newFilePath = path.join(mediaFolder, newFile);

        if (fs.existsSync(newFilePath)) {
            message.channel.send(`${newFile} already exists. Please choose a different new name.`);
            return;
        }

        fs.renameSync(oldFilePath, newFilePath);
        updateFileList();
        message.channel.send(`File renamed from ${oldFile} to ${newFile}`);
    } else {
        message.channel.send(`File with the name ${oldName} not found.`);
    }
}

// Delete media file
function deleteCommand(message, args) {

    if (!hasPermission(message)) return;

    const fileNameToDelete = args[1]?.toLowerCase();
    const fileToDeleteIdx = fileListNoExt.indexOf(fileNameToDelete);
    const fileToDelete = fileToDeleteIdx !== -1 ? fileList[fileToDeleteIdx] : null;

    if (!fileToDelete) {
        message.channel.send(`File with the name ${fileNameToDelete} not found.`);
        return;
    }

    fs.unlinkSync(path.join(mediaFolder, fileToDelete));
    updateFileList();
    message.channel.send(`File ${fileToDelete} has been successfully deleted.`);

}

// Set moderation bot user ID
function setModBotID(message, args) {

    if (!hasPermission(message)) return;

    if (!args || message.author.bot) {
        message.channel.send("Please specify a valid bot user ID");
        return;
    }

    cfg.MODERATION_BOT_ID = args[1];
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    message.channel.send("Bot ID has been set");

}

// Set media to be returned when a user is muted
function setMuteMedia(message, args) {

    if (!hasPermission(message)) return;

    const fileNameToSet = args[1]?.toLowerCase();
    const mediaIdx = fileListNoExt.indexOf(fileNameToSet);
    const mediaName = mediaIdx !== -1 ? fileListNoExt[mediaIdx] : null;

    // Validate the provided name
    if (!mediaName || message.author.bot) {
        message.channel.send("Please specify a valid media name");
        return;
    }

    // Save only the name without extension to config
    cfg.MediaForMutedUsers = mediaName;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    message.channel.send(`Mute media has been set to ${args[1]}`);

}

// Permission check function
function hasPermission(message) {
    if (!message.member.permissions.has(['ADMINISTRATOR', 'MANAGE_MESSAGES'])) {
        message.channel.send("You don't have permission to use this command.");
        return false;
    }
    return true;
}

module.exports = {
    returnFile,
    listMediaCommand,
    uploadCommand,
    renameCommand,
    deleteCommand,
    setModBotID,
    setMuteMedia
};