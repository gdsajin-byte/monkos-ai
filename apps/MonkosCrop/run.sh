#!/bin/bash
pkill -f "MonkosCrop" 2>/dev/null
cd "$(dirname "$0")"
swift build 2>&1 | tail -3
nohup .build/debug/MonkosCrop &>/dev/null &
echo "MonkosCrop launched (PID: $!)"
