const fs = require('fs');
const https = require('https');
const utils = require('./utils');

exports.handler = async (event, context, callback) => {
  /**
  @param {_meta} object - contains meta site data and a list of all site files being published
  */
  const response = {
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
    },
    statusCode: 200,
    body: JSON.stringify({ result: 'Successfully ran publish webhook!' }),
  };

  const body = JSON.parse(event.body);
  const drzzleFolder = new RegExp(`^https://(.*)/sites/${body._meta.siteName}/`, 'g');

  try {
    await Promise.all(body._meta.siteFiles.map(file => new Promise(async (resolve, reject) => {
      const serverPath = file.split(drzzleFolder)[2];
      const tmpFile = `/tmp/${serverPath}`;
      await utils.ensureDur(tmpFile);
      const stream = fs.createWriteStream(tmpFile);
      // here we download the file into lambda's tmp folder
      https.get(file, (res) => {
        res.pipe(stream)
          .on('finish', async () => {
            // create a buffer if uploading to a location that requires it
            const buffer = fs.readFileSync(tmpFile);
            const filePayload = { tmpFile, serverPath, buffer };
            try {
              // after file is created, run what you need to with it
              await utils.onFileCreated(filePayload);
              // delete file from tmp when all is done
              fs.unlinkSync(tmpFile);
              resolve(filePayload);
            } catch (e) {
              reject(e);
              throw new Error(e);
            }
            return file;
          })
          .on('error', (e) => {
            reject(e);
            throw new Error(e);
          });
      });
    })));
  } catch (e) {
    // leave error code @ 409 so drzzle can look for this and warn of any failures
    response.statusCode = 409;
    response.body = JSON.stringify({ result: e.message || e });
  }

  return callback(null, response);
};
