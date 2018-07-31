#!/usr/bin/env bash
set -e

# Start Xvfb
# Xvfb -ac -screen scrn 1024x768x24 :9.0 &
# export DISPLAY=:9.0
# export DEBUG=nightmare*

forever -o start dist/server/app.js
