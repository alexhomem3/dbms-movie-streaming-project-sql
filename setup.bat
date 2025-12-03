@echo off
REM StreamFlix Setup Script for Windows
REM This script sets up everything needed to run the application

echo.
echo 🎬 StreamFlix Setup Script
echo ==========================
echo.

REM Step 1: Install Node.js dependencies
echo Step 1: Installing Node.js dependencies...
call npm install
echo ✓ Dependencies installed
echo.

REM Step 2: Check if MySQL password is needed
echo Step 2: Database setup...
set MYSQL_PASSWORD=
set MYSQL_CMD=mysql -u root
set MYSQL_CMD_WITH_DB=mysql -u root streamflix

REM Test connection without password
%MYSQL_CMD% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    REM Password is required
    set /p MYSQL_PASSWORD="Enter MySQL root password: "
    set MYSQL_CMD=mysql -u root -p%MYSQL_PASSWORD%
    set MYSQL_CMD_WITH_DB=mysql -u root -p%MYSQL_PASSWORD% streamflix
)

REM Step 3: Create database
echo Creating database if it doesn't exist...
%MYSQL_CMD% -e "CREATE DATABASE IF NOT EXISTS streamflix;" 2>nul
if errorlevel 1 (
    echo ✗ Failed to connect to MySQL. Please check your password.
    pause
    exit /b 1
)
echo ✓ Database ready

REM Step 4: Check if database is already populated and import if needed
%MYSQL_CMD_WITH_DB% -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'streamflix';" -s -N > temp_table_count.txt 2>nul
set /p TABLE_COUNT=<temp_table_count.txt
del temp_table_count.txt 2>nul

if "%TABLE_COUNT%"=="" set TABLE_COUNT=0
if %TABLE_COUNT% GTR 0 (
    echo ✓ Database already has tables, skipping import
    echo   (To reset: drop and recreate the database manually)
) else (
    echo Importing SQL schema and data...
    %MYSQL_CMD_WITH_DB% < dbms-movie-streaming-project-sql\ProjectPhase3.sql 2>nul
    echo ✓ Database imported
)
echo.

REM Step 5: Create .env file
echo Step 3: Creating .env file...
if not exist ".env" (
    (
        echo DB_HOST=127.0.0.1
        echo DB_USER=root
        echo DB_PASSWORD=%MYSQL_PASSWORD%
        echo DB_NAME=streamflix
        echo PORT=3000
    ) > .env
    echo ✓ .env file created
) else (
    echo ⚠ .env file already exists, skipping...
)
echo.

REM Step 6: Check port 3000
echo Step 4: Checking port 3000...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3000 is already in use
    set /p KILL_PORT="Kill the process using port 3000? (y/N): "
    if /i "%KILL_PORT%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul
        echo ✓ Port 3000 should be free now
    ) else (
        echo ✗ Cannot start server - port 3000 is in use
        echo Please stop the process using port 3000 and run this script again
        pause
        exit /b 1
    )
) else (
    echo ✓ Port 3000 is available
)
echo.

REM Step 7: Start the server
echo ==========================
echo 🎉 Setup complete!
echo ==========================
echo.
echo Starting the server...
echo Open your browser to: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

