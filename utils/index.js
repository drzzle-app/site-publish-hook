const fs = require('fs');
const path = require('path');

module.exports = {
  onFileCreated(params) {
    /**
      @param {tmpFile} string - file path in lambda's tmp folder after downloaded
      @param {serverPath} string - file path the file needs to be in on your server
      @param {buffer} array - file buffer for raw uploading
    */
    return new Promise(async (resolve, reject) => {
      try {
        /*
          NOTE: use this utililty function to do whatever
          you need to do to each site file as it's created. Upload
          it to a server, a bucket, a cdn etc.
        */
        resolve(params);
      } catch (e) {
        reject(e.message || e);
      }
    });
  },
  ensureDur(folder) {
    return new Promise((resolve, reject) => {
      const location = path.dirname(folder);
      fs.mkdir(location, { recursive: true }, (e) => {
        if (e) {
          reject(e.message || e);
        }
        resolve(location);
      });
    });
  },
};
