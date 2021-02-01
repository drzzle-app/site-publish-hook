/* eslint no-console: 0 */
const { exec } = require('child_process');
const fs = require('fs-extra');
const YAML = require('yaml');
const ora = require('ora');

const yml = fs.readFileSync('./aws.yml', 'utf8');
const aws = YAML.parse(yml);
const lambda = aws.lambda;

// command runner callback
const command = cmd => new Promise((res, rej) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      rej(stdout);
    }
    if (stderr && !stderr.match(/npm WARN/gi)) {
      rej(stdout);
    }
    console.log('\x1b[36m', `Finished\n ${stdout}`);
    res();
  });
});

(async () => {
  const spinner = ora('Running linter...').start();
  try {
    await command('npm run lint');
    spinner.text = 'Gathering files...';
    // delete old zip first
    const oldZip = await fs.pathExists('./dist.zip');
    if (oldZip) {
      await fs.remove('./dist.zip');
    }
    // gather files for new zip package
    await fs.ensureDir('./dist');
    await Promise.all(lambda.files.map(file => fs.copy(`./${file}`, `./dist/${file}`)));
    // install dist modules
    spinner.text = 'Installing node modules...';
    await command('cd dist; npm install --only=production; cd -');
    // zip files
    spinner.text = 'Building zip...';
    await command('zip -r dist.zip dist');
    fs.remove('./dist');
    // upload to lambda
    spinner.text = 'Uploading function to lambda...';
    // gather lambda variables
    let vars = '';
    if (lambda.variables) {
      const keys = Object.keys(lambda.variables);
      const last = keys[keys.length - 1];
      vars += '--environment "Variables={';
      for (const [key, value] of Object.entries(lambda.variables)) {
        let spacer = ',';
        if (key === last) {
          spacer = '';
        }
        vars += `${key}=${value}${spacer}`;
      }
      vars += '}"';
    }
    // fire off aws cli commands needed
    await command(`aws lambda update-function-code --function-name ${lambda['function-name']} --zip-file fileb://${__dirname}/dist.zip --region ${lambda.region}`);

    spinner.text = 'Updating function configuration...';
    await command(`aws lambda update-function-configuration --function-name ${lambda['function-name']} --handler "dist/index.handler" ${vars} --region ${lambda.region} --timeout ${lambda.timeout}`);

    // remove zip when all is done
    await fs.remove('./dist.zip');
    console.log('\x1b[36m', 'Deployment Complete!');
  } catch (e) {
    // abort further if errors
    console.log('\x1b[31m', e);
  } finally {
    spinner.stop();
  }
})();
