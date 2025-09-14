#!/bin/bash

# StreamFlix Demo Build Script
# Builds the application for production deployment

set -e

echo "🎬 Building StreamFlix Demo Application..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p dist
mkdir -p logs
mkdir -p public/assets

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Copy static assets
echo "📋 Copying static assets..."
cp -r public/* dist/

# Minify CSS (if you have a CSS minifier)
if command -v csso &> /dev/null; then
    echo "🎨 Minifying CSS..."
    csso public/css/styles.css --output dist/css/styles.min.css
else
    echo "ℹ️  CSS minifier not found, copying CSS as-is..."
    cp public/css/styles.css dist/css/styles.css
fi

# Minify JavaScript (if you have a JS minifier)
if command -v uglifyjs &> /dev/null; then
    echo "⚡ Minifying JavaScript..."
    uglifyjs public/js/tokn-sdk-demo.js --output dist/js/tokn-sdk-demo.min.js --compress --mangle
    uglifyjs public/js/app.js --output dist/js/app.min.js --compress --mangle
else
    echo "ℹ️  JavaScript minifier not found, copying JS as-is..."
    cp public/js/*.js dist/js/
fi

# Create version file
echo "📝 Creating version file..."
cat > dist/version.json << EOF
{
  "version": "$(npm run version --silent 2>/dev/null || echo '1.0.0')",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "environment": "production"
}
EOF

# Create favicon if it doesn't exist
if [ ! -f "public/assets/favicon.ico" ]; then
    echo "🎯 Creating default favicon..."
    # Create a simple favicon (you can replace this with a proper favicon)
    echo "📺" > dist/assets/favicon.ico
fi

# Validate build
echo "🔍 Validating build..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build validation failed: index.html not found"
    exit 1
fi

if [ ! -f "dist/css/styles.css" ]; then
    echo "❌ Build validation failed: styles.css not found"
    exit 1
fi

if [ ! -f "dist/js/tokn-sdk-demo.js" ]; then
    echo "❌ Build validation failed: tokn-sdk-demo.js not found"
    exit 1
fi

# Show build summary
echo ""
echo "✅ Build completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Build Summary:"
echo "   • Static files: $(find dist -type f | wc -l) files"
echo "   • Total size: $(du -sh dist | cut -f1)"
echo "   • Build output: ./dist/"
echo "   • Server files: ./server/"
echo ""
echo "🚀 Next steps:"
echo "   • Run 'npm start' to start the production server"
echo "   • Run 'npm run deploy' to deploy to production"
echo "   • Run 'docker-compose up' to start with Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"