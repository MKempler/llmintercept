#!/bin/bash
# Build script for AI Prompt Firewall browser extension

set -e

EXTENSION_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$EXTENSION_DIR/dist"
ZIP_NAME="aifirewall-extension-v1.0.0.zip"

echo "Building AI Prompt Firewall extension..."

# Create dist directory
mkdir -p "$DIST_DIR"

# Copy extension files
echo "Copying extension files..."
cp manifest.json "$DIST_DIR/"
cp background.js "$DIST_DIR/"
cp content.js "$DIST_DIR/"
cp popup.html "$DIST_DIR/"
cp popup.js "$DIST_DIR/"

# Copy icons directory
echo "Copying icons..."
cp -r icons "$DIST_DIR/"

# Create zip file
echo "Creating zip archive..."
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.git*"

echo ""
echo "✅ Extension packaged successfully!"
echo "📦 Output: $EXTENSION_DIR/$ZIP_NAME"
echo ""
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist' folder"
echo ""
echo "Or distribute the zip file to customers."

