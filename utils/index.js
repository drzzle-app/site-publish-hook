const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

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

        /*
        =============================== s3 upload example ================================
        Here is an example of uploading each file to a public s3 bucket. If going this route,
        be sure to give this lambda function permissions to upload to the s3 bucket and to
        turn on web hosting on your bucket settings.
        ==================================================================================
        */
        const s3 = new AWS.S3({ region: process.env.BUCKET_REGION });
        await s3.upload({
          Bucket: process.env.BUCKET_NAME,
          Body: params.buffer,
          ACL: 'public-read',
          Key: params.serverPath,
          ContentType: mime.getType(path.basename(params.serverPath)),
          ServerSideEncryption: 'AES256',
        }).promise();
        /*
        ==================================================================================
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
