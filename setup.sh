#!/bin/bash

# StreamFlix Setup Script
# This script sets up everything needed to run the application

set -e  # Exit on error

echo "🎬 StreamFlix Setup Script"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install Node.js dependencies
echo -e "${YELLOW}Step 1: Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Check if MySQL is running
echo -e "${YELLOW}Step 2: Checking MySQL...${NC}"
if ! mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
    echo -e "${RED}✗ MySQL is not running${NC}"
    echo "Starting MySQL..."
    if command -v brew &> /dev/null; then
        brew services start mysql
        sleep 3
    else
        echo "Please start MySQL manually and run this script again"
        exit 1
    fi
fi
echo -e "${GREEN}✓ MySQL is running${NC}"
echo ""

# Step 3: Check if MySQL password is needed
echo -e "${YELLOW}Step 3: Database setup...${NC}"
MYSQL_PASSWORD=""
MYSQL_CMD="mysql -u root"
MYSQL_CMD_WITH_DB="mysql -u root streamflix"

# Test connection without password
if ! $MYSQL_CMD -e "SELECT 1;" >/dev/null 2>&1; then
    # Password is required
    read -sp "Enter MySQL root password: " MYSQL_PASSWORD
    echo ""
    MYSQL_CMD="mysql -u root -p$MYSQL_PASSWORD"
    MYSQL_CMD_WITH_DB="mysql -u root -p$MYSQL_PASSWORD streamflix"
fi

# Step 4: Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
$MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS streamflix;" 2>/dev/null || {
    echo -e "${RED}✗ Failed to connect to MySQL. Please check your password.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Database ready${NC}"

# Step 5: Check if database is already populated
TABLE_COUNT=$($MYSQL_CMD_WITH_DB -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'streamflix';" -s -N 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Database already has tables, skipping import${NC}"
    echo -e "${YELLOW}  (To reset: drop and recreate the database manually)${NC}"
else
    # Step 6: Import SQL file
    echo "Importing SQL schema and data..."
    $MYSQL_CMD_WITH_DB < dbms-movie-streaming-project-sql/ProjectPhase3.sql 2>/dev/null || {
        echo -e "${YELLOW}⚠ SQL import had some warnings, but continuing...${NC}"
    }
    echo -e "${GREEN}✓ Database imported${NC}"
fi
echo ""

# Step 7: Create .env file
echo -e "${YELLOW}Step 4: Creating .env file...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << EOF
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=$MYSQL_PASSWORD
DB_NAME=streamflix
PORT=3000
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping...${NC}"
fi
echo ""

# Step 8: Check if port 3000 is in use
echo -e "${YELLOW}Step 5: Checking port 3000...${NC}"
PORT_IN_USE=false
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 3000 is already in use${NC}"
    read -p "Kill the process using port 3000? (y/N): " KILL_PORT
    if [[ $KILL_PORT =~ ^[Yy]$ ]]; then
        kill -9 $(lsof -ti:3000) 2>/dev/null || true
        sleep 2
        # Verify port is now free
        if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo -e "${GREEN}✓ Port 3000 is now free${NC}"
        else
            echo -e "${RED}✗ Failed to free port 3000. Please kill the process manually.${NC}"
            PORT_IN_USE=true
        fi
    else
        echo -e "${RED}✗ Cannot start server - port 3000 is in use${NC}"
        echo "Please stop the process using port 3000 and run this script again, or:"
        echo "  kill -9 \$(lsof -ti:3000)"
        PORT_IN_USE=true
    fi
else
    echo -e "${GREEN}✓ Port 3000 is available${NC}"
fi
echo ""

# Exit if port is still in use
if [ "$PORT_IN_USE" = true ]; then
    echo -e "${RED}Setup incomplete. Please free port 3000 and try again.${NC}"
    exit 1
fi

# Step 9: Start the server
echo -e "${GREEN}=========================="
echo "🎉 Setup complete!"
echo "==========================${NC}"
echo ""
echo "Starting the server..."
echo "Open your browser to: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start

