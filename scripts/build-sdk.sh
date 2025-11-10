#!/bin/bash
# Build script for AI Prompt Firewall SDK

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
SDK_NAME="aifirewall-sdk-v1.0.0"

echo "Building AI Prompt Firewall SDK..."

# Clean previous builds
rm -rf "$DIST_DIR" "$SCRIPT_DIR/build" "$SCRIPT_DIR/*.egg-info" 2>/dev/null || true

# Create distribution
echo "Creating source distribution..."
python3 setup.py sdist bdist_wheel

# Create zip file with SDK
echo "Creating zip archive..."
mkdir -p "$DIST_DIR"
cd "$SCRIPT_DIR"
zip -r "$DIST_DIR/$SDK_NAME.zip" \
  sdk/ \
  setup.py \
  MANIFEST.in \
  README.md \
  -x "*.pyc" "*.pyo" "__pycache__/*" "*.DS_Store" "*.git*"

echo ""
echo "✅ SDK packaged successfully!"
echo "📦 Output files:"
echo "   - Source distribution: dist/aifirewall-*.tar.gz"
echo "   - Wheel: dist/aifirewall-*.whl"
echo "   - Zip archive: dist/$SDK_NAME.zip"
echo ""
echo "To install:"
echo "  pip install dist/aifirewall-*.whl"
echo ""
echo "Or distribute the zip file to customers."

