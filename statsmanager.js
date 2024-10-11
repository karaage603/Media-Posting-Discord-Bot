const fs = require('fs');
const path = require('path');

class StatsManager {
  constructor(statsFilePath) {
    this.statsFilePath = statsFilePath;
    this.fileRequestCount = {};

    // Load existing statistics from the file
    if (fs.existsSync(this.statsFilePath)) {
      const statsFileContent = fs.readFileSync(this.statsFilePath, 'utf-8');
      this.fileRequestCount = JSON.parse(statsFileContent);
    }
  }

  // Increment file request count
  incrementFileRequest(fileName) {
    if (!this.fileRequestCount[fileName]) {
      this.fileRequestCount[fileName] = 0;
    }
    this.fileRequestCount[fileName]++;
    this.saveStatsToFile();
  }

  // Get sorted statistics for all files
  getSortedStats() {
    return Object.entries(this.fileRequestCount)
      .sort(([, countA], [, countB]) => countB - countA); // Sort entries by count in descending order
  }

  // Save the statistics to the file
  saveStatsToFile() {
    const statsFileContent = JSON.stringify(this.fileRequestCount, null, 2);
    fs.writeFileSync(this.statsFilePath, statsFileContent, 'utf-8');
  }
}

module.exports = StatsManager;