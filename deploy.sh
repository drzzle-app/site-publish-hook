#!/usr/bin/env sh

dir=`pwd`
type="fileb://"
file="$type$dir/dist.zip"

# abort on errors
set -e

# lint first
npm run lint

# remove old dist if it exists
if [ -e dist.zip ]
then
  rm dist.zip
fi

# zip dir
mkdir dist
cp -a index.js dist/index.js
cp -a package.json dist/package.json
cp -aR utils dist/utils

# install production node modules
cd dist
npm install --only=production
cd -

# zip it all up
zip -r dist.zip dist
rm -rf dist/

# aws cli tool is a pre-req for the rest with the correct IAM role/config
echo "uploading to lambda..."

# upload zip to lambda
aws lambda update-function-code --function-name site-publish-hook --zip-file $file --region us-west-2
aws lambda update-function-configuration --function-name site-publish-hook --handler "dist/index.handler" --region us-west-2

# remove uneeded dist and package if it exists
if [ -e dist.zip ]
then
  rm dist.zip
fi
