#!/bin/bash
# DocuVerse Quick Start Script for Linux/macOS

echo "========================================"
echo "DocuVerse Quick Start"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
    echo "Virtual environment created!"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi

# Check if dependencies are installed
pip show fastapi > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "Dependencies installed!"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Please copy .env.example to .env and add your API keys"
    echo ""
    exit 1
fi

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo "WARNING: Mermaid CLI not found!"
    echo "Please install it: npm install -g @mermaid-js/mermaid-cli"
    echo ""
    exit 1
fi

echo "========================================"
echo "Starting DocuVerse server..."
echo "========================================"
echo "Server will be available at: http://127.0.0.1:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start Node Backend in background
(cd backend && npm install && node server.js) &

uvicorn backend.beta.main:app --reload
