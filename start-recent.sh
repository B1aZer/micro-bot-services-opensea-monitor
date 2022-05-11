#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1
cd /home/hipi/Sites/GooDee/opensea-monitor
node --unhandled-rejections=strict latest.js | ts '[%Y-%m-%d %H:%M:%.S]' >> /home/hipi/Sites/GooDee/_airflow/recent_collections.log
status=$?
if [ $status -ne 0 ]; then
    sleep 60m
    node --unhandled-rejections=strict latest.js | ts '[%Y-%m-%d %H:%M:%.S]' >> /home/hipi/Sites/GooDee/_airflow/recent_collections.log
fi
if [ $status -ne 0 ]; then
    sleep 60m
    node --unhandled-rejections=strict latest.js | ts '[%Y-%m-%d %H:%M:%.S]' >> /home/hipi/Sites/GooDee/_airflow/recent_collections.log
fi
if [ $status -ne 0 ]; then
    sleep 60m
    node --unhandled-rejections=strict latest.js | ts '[%Y-%m-%d %H:%M:%.S]' >> /home/hipi/Sites/GooDee/_airflow/recent_collections.log
fi