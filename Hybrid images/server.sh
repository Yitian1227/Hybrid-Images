#!/bin/bash

echo "Starting Hybrid Images Server..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "Error: Python is not installed"
        echo "Please install Python from https://python.org"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# Check if required files exist
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found"
    exit 1
fi

if [ ! -f "shaders.js" ]; then
    echo "Error: shaders.js not found"
    exit 1
fi

if [ ! -f "main.js" ]; then
    echo "Error: main.js not found"
    exit 1
fi

# Start the server
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo
$PYTHON_CMD server.py
