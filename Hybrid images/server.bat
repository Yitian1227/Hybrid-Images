@echo off
echo Starting Hybrid Images Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Check if required files exist
if not exist "index.html" (
    echo Error: index.html not found
    pause
    exit /b 1
)

if not exist "shaders.js" (
    echo Error: shaders.js not found
    pause
    exit /b 1
)

if not exist "main.js" (
    echo Error: main.js not found
    pause
    exit /b 1
)

REM Start the server
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python server.py

pause
