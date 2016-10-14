#!/usr/bin/env bash
set -e

# Start Xvfb
Xvfb -ac -screen scrn 1200x850x24 :9.0 &
export DISPLAY=:9.0

exec "$@"
