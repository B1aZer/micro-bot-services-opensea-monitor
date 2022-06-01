#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1
cp app.log app-prev.log
node app.js | ts '[%Y-%m-%d %H:%M:%.S]' > app.log
