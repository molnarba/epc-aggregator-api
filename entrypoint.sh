#!/bin/sh
if [[ ! -z $GRAYLOG_HOST || ! -z $GRAYLOG_PORT ]]; then
  GRAYLOG_ENDPOINT="-h $GRAYLOG_HOST -p $GRAYLOG_PORT"
  echo "Sending gelf messages to $GRAYLOG_ENDPOINT"
fi

node ./dist/apps/api-hub/main.js | pino-gelf log -v -t $GRAYLOG_ENDPOINT
