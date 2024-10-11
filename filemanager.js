const fs = require('fs');
const path = require('path');
const https = require('https');

const mediaFolder = './media';
let fileList = fs.existsSync(mediaFolder) ? fs.readdirSync(mediaFolder) : [];
let fileListNoExt = fileList.map(file => path.parse(file).name.toLowerCase());

// Return the media file
function returnFile(message, args) {
    const mediaIdx = fileListNoExt.indexOf(args);
    const mediaName = mediaIdx > -1 ? fileList[mediaIdx] : null;
    if(mediaName) message.reply({ files: [`${mediaFolder}/${mediaName}`] });
    else message.reply("File not found. Use `dz list` to check available files.");
}

// Update the file list
function updateFileList() {
    fileList = fs.readdirSync(mediaFolder);
    fileListNoExt = fileList.map(file => path.parse(file).name.toLowerCase());
}

// List all media files
function listMediaCommand(message) {
    message.reply(`These are the available media:\n${fileListNoExt.join('\n')}`);
}

// Upload media file
function uploadCommand(message, args) {
    if (!hasPermission(message)) return;

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

    if (fs.existsSync(newFilePath)) {
        message.reply(`${newFileName} already exists. Please choose a different name.`);
        return;
    }

    const file = fs.createWriteStream(newFilePath);
    https.get(attachment.url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
        file.close();
        updateFileList();
        message.reply(`Media saved as: ${newFilePath}`);
        });
    });
}

// Rename media file
function renameCommand(message, args) {
    if (!hasPermission(message)) return;
    
    const oldName = args[2]?.toLowerCase();
    const newName = args[3]?.toLowerCase();
    
    const oldIdx = fileListNoExt.indexOf(oldName);
    if (oldIdx > -1) {
        const oldFile = fileList[oldIdx];
        const newFile = `${newName}${path.extname(oldFile)}`;
        const oldFilePath = path.join(mediaFolder, oldFile);
        const newFilePath = path.join(mediaFolder, newFile);

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

// Delete media file
function deleteCommand(message, args) {
    if (!hasPermission(message)) return;

    const fileNameToDelete = args[2]?.toLowerCase();
    const fileToDeleteIdx = fileListNoExt.indexOf(fileNameToDelete);
    const fileToDelete = fileToDeleteIdx > -1 ? fileList[fileToDeleteIdx] : null;

    if (!fileToDelete) {
        message.reply(`File with the name ${fileNameToDelete} not found.`);
        return;
    }

    fs.unlinkSync(path.join(mediaFolder, fileToDelete));
    updateFileList();
    message.reply(`File ${fileToDelete} has been successfully deleted.`);
}

// Permission check function
function hasPermission(message) {
    if (!message.member.permissions.has(['ADMINISTRATOR', 'MANAGE_MESSAGES'])) {
        message.reply("You don't have permission to use this command.");
        return false;
    }
    return true;
}

module.exports = { returnFile, listMediaCommand, uploadCommand, renameCommand, deleteCommand };