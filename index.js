const fs = require('fs');
const https = require('https');
const utils = require('./utils');

exports.handler = async (event, context, callback) => {
  /**
  @param {object} _meta - contains meta site data as well as a full list of site files
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
  await Promise.all(body._meta.siteFiles.map(file => new Promise(async (resolve, reject) => {
    try {
      const serverPath = file.split(drzzleFolder)[2];
      const tmpFile = `/tmp/${serverPath}`;
      await utils.ensureDur(tmpFile);
      const stream = fs.createWriteStream(tmpFile);
      // here we download the file into lambda's tmp folder
      https.get(file, async (res) => {
        res.pipe(stream)
          .on('finish', async () => {
            // create a buffer if uploading to a location that requires it
            const buffer = fs.readFileSync(tmpFile);
            const filePayload = { tmpFile, serverPath, buffer };
            // after file is created, run what you need to with it
            await utils.onFileCreated(filePayload);
            // delete file from tmp when all is done
            fs.unlinkSync(tmpFile);
            resolve(filePayload);
          })
          .on('error', (e) => { throw new Error(e.message || e); });
      });
    } catch (e) {
      reject(e);
      response.statusCode = 409;
      response.body = JSON.stringify({ result: e.message || e });
    }
  })));

  return callback(null, response);
};
