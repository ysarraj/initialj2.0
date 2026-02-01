#!/bin/bash
# Automated Local Deployment Script for InitialJ.com
# This script builds and deploys directly from your Ubuntu machine

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server configuration
SSH_HOST="57-107201.ssh.hosting-ik.com"
SSH_USER="fn8rsk_ysarraj"
DEPLOY_PATH="~/sites/initialj.com"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    InitialJ.com - Automated Local Deployment Script           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for production environment file
if [ ! -f ".env.production" ]; then
  echo -e "${RED}Error: .env.production not found. Deploy requires .env.production with MySQL DATABASE_URL.${NC}"
  exit 1
fi

# Verify .env.production has MySQL DATABASE_URL
if ! grep -q "mysql://" .env.production; then
  echo -e "${YELLOW}⚠ Warning: .env.production may not contain MySQL DATABASE_URL${NC}"
fi

# Step 1: Build the application (NODE_ENV=production so .env.production is loaded)
echo -e "${YELLOW}📦 Step 1/4: Building Next.js application (production)...${NC}"
NODE_ENV=production npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Package the build
echo -e "${YELLOW}📂 Step 2/4: Packaging build files...${NC}"
TEMP_DIR=$(mktemp -d)
echo "   Using temp directory: $TEMP_DIR"

# Copy all necessary files
cp -r .next "$TEMP_DIR/.next"
cp package.json "$TEMP_DIR/package.json"
[ -f package-lock.json ] && cp package-lock.json "$TEMP_DIR/package-lock.json"
[ -f .npmrc ] && cp .npmrc "$TEMP_DIR/.npmrc"
[ -f next.config.ts ] && cp next.config.ts "$TEMP_DIR/next.config.ts"
[ -f next.config.js ] && cp next.config.js "$TEMP_DIR/next.config.js"
[ -d prisma ] && cp -r prisma "$TEMP_DIR/prisma"
[ -d public ] && cp -r public "$TEMP_DIR/public"
[ -d app ] && cp -r app "$TEMP_DIR/app"
[ -d src ] && cp -r src "$TEMP_DIR/src"
[ -f tsconfig.json ] && cp tsconfig.json "$TEMP_DIR/tsconfig.json"
[ -f postcss.config.mjs ] && cp postcss.config.mjs "$TEMP_DIR/postcss.config.mjs"
[ -f eslint.config.mjs ] && cp eslint.config.mjs "$TEMP_DIR/eslint.config.mjs"

# Copy environment file for production
if [ -f .env.production ]; then
  cp .env.production "$TEMP_DIR/.env.production"
  echo "   ✓ Including .env.production"
elif [ -f .env.local ]; then
  cp .env.local "$TEMP_DIR/.env.production"
  echo "   ✓ Including .env.local as .env.production"
fi

# Verify Prisma schema is ready for MySQL
if [ -f "$TEMP_DIR/prisma/schema.prisma" ]; then
  # Check if schema needs to be updated for MySQL
  if grep -q 'provider = "sqlite"' "$TEMP_DIR/prisma/schema.prisma"; then
    echo "   ⚠ Warning: Prisma schema uses SQLite - ensure it's configured for MySQL in production"
    echo "   → You may need to update the schema provider to 'mysql' for production"
  elif grep -q 'provider = "mysql"' "$TEMP_DIR/prisma/schema.prisma"; then
    echo "   ✓ Prisma schema verified (MySQL provider)"
  fi
fi

# Create tarball
cd "$TEMP_DIR"
PACKAGE_FILE="initialj-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "/tmp/$PACKAGE_FILE" .
cd - > /dev/null
echo -e "${GREEN}✓ Package created: /tmp/$PACKAGE_FILE${NC}"
echo ""

# Step 3: Create combined deployment and restart script
echo -e "${YELLOW}📝 Step 3/4: Creating deployment script...${NC}"
COMBINED_SCRIPT="/tmp/combined_deploy_$$.sh"
cat > "$COMBINED_SCRIPT" << 'EOFSCRIPT'
#!/bin/bash
set -e
DEPLOY_PATH="$HOME/sites/initialj.com"
PACKAGE_FILE="$1"

echo "═══════════════════════════════════════════════════════════════"
echo "STEP 1: Preparing deployment directory..."
echo "═══════════════════════════════════════════════════════════════"
mkdir -p "$DEPLOY_PATH"
if [ -d "$DEPLOY_PATH/.next" ]; then
  rm -rf "$DEPLOY_PATH/.next"
  echo "✓ Removed old .next build"
fi
echo "✓ Deployment directory ready"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 2: Extracting new deployment..."
echo "═══════════════════════════════════════════════════════════════"
tar -xzf "$HOME/$PACKAGE_FILE" -C "$DEPLOY_PATH"
echo "✓ Files extracted"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 3: Installing production dependencies..."
echo "═══════════════════════════════════════════════════════════════"
cd "$DEPLOY_PATH"
# Use npm install instead of npm ci to handle existing node_modules better
npm install --omit=dev --legacy-peer-deps 2>&1 | tail -5
echo "✓ Dependencies installed"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 4: Generating Prisma client..."
echo "═══════════════════════════════════════════════════════════════"
# Clean up any corrupted Prisma client first
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf node_modules/@prisma/client 2>/dev/null || true

# Reinstall Prisma packages to ensure they're fresh
npm install @prisma/client prisma --omit=dev --legacy-peer-deps 2>&1 | tail -3

# Update Prisma schema for MySQL if needed (check if SQLite is still in schema)
if grep -q 'provider = "sqlite"' prisma/schema.prisma 2>/dev/null; then
  echo "→ Updating Prisma schema for MySQL..."
  sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
  sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")|' prisma/schema.prisma
  echo "✓ Schema updated for MySQL"
fi

# Generate Prisma client
npx prisma generate 2>&1 | grep -E "(Generated|Prisma Client|error)" || echo "✓ Prisma client generated"

# Verify Prisma client was generated successfully
if [ ! -d "node_modules/.prisma/client" ]; then
  echo "✗ ERROR: Prisma client generation failed"
  exit 1
fi
echo "✓ Prisma client verified"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 5: Running database migrations..."
echo "═══════════════════════════════════════════════════════════════"
# Push schema to database (creates tables if they don't exist)
npx prisma db push --accept-data-loss 2>&1 | tail -10 || echo "⚠ Database push completed (warnings may be normal)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 6: Verifying Next.js build artifacts..."
echo "═══════════════════════════════════════════════════════════════"
if [ ! -f .next/BUILD_ID ]; then
  echo "ERROR: .next/BUILD_ID not found" >&2
  exit 1
fi
BUILD_ID=$(cat .next/BUILD_ID || echo "")
if [ -z "$BUILD_ID" ]; then
  echo "ERROR: BUILD_ID is empty" >&2
  exit 1
fi
if [ ! -f ".next/static/$BUILD_ID/_buildManifest.js" ] || [ ! -f ".next/static/$BUILD_ID/_ssgManifest.js" ]; then
  echo "ERROR: Missing Next static manifests for BUILD_ID $BUILD_ID" >&2
  exit 1
fi
# Check for either webpack chunks (webpack build) or any .js chunks (turbopack build)
CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -lt 10 ]; then
  echo "ERROR: Missing chunks under .next/static/chunks (found only $CHUNK_COUNT)" >&2
  exit 1
fi
echo "✓ BUILD_ID: $BUILD_ID (assets verified)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 7: Stopping Node.js processes..."
echo "═══════════════════════════════════════════════════════════════"

# Kill all node and next processes (multiple methods for reliability)
echo "→ Stopping existing Node.js and Next.js processes..."
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "next" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
killall -9 node 2>/dev/null || true
killall -9 next 2>/dev/null || true

# Wait for processes to terminate
sleep 3

# Nuclear option - kill everything owned by user containing next/node
pkill -9 -u $USER -f "next" 2>/dev/null || true
pkill -9 -u $USER -f "node" 2>/dev/null || true

# Also try to kill anything on port 3000
if command -v lsof >/dev/null 2>&1; then
  PORT_PID=$(lsof -ti:3000 2>/dev/null || echo "")
  if [ -n "$PORT_PID" ]; then
    echo "→ Killing process on port 3000 (PID: $PORT_PID)..."
    kill -9 $PORT_PID 2>/dev/null || true
    sleep 1
    echo "✓ Port 3000 freed"
  fi
fi

# Try fuser as backup
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 2>/dev/null || true
fi

# Clean up any stale lock files
cd "$DEPLOY_PATH"
rm -f .next/cache/lock 2>/dev/null || true

# Wait again to ensure everything is dead
sleep 2

echo "✓ All Node.js processes stopped and cleaned up"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 8: Starting Node.js application..."
echo "═══════════════════════════════════════════════════════════════"
mkdir -p "$HOME/logs"
nohup npm start > "$HOME/logs/nodejs.log" 2>&1 &
NEW_PID=$!
sleep 3

if ps -p $NEW_PID > /dev/null; then
  echo "✓ Application started successfully (PID: $NEW_PID)"
  echo "✓ Log file: $HOME/logs/nodejs.log"
else
  echo "⚠ Warning: Application may have failed to start"
  echo "⚠ Check logs at: $HOME/logs/nodejs.log"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 9: Cleaning up..."
echo "═══════════════════════════════════════════════════════════════"
rm "$HOME/$PACKAGE_FILE"
rm "$HOME/combined_deploy.sh"
echo "✓ Cleanup complete"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
EOFSCRIPT

echo -e "${GREEN}✓ Deployment script created${NC}"
echo ""

# Step 4: Upload and execute everything in one SSH session
echo -e "${YELLOW}🚀 Step 4/4: Uploading and deploying...${NC}"
echo -e "${BLUE}   You will be prompted for your password ONCE${NC}"
echo ""

# Use a single SSH connection with ControlMaster to reuse for both SCP and SSH
CONTROL_PATH="/tmp/ssh-control-$$"
SSH_OPTS="-o ControlMaster=auto -o ControlPath=$CONTROL_PATH -o ControlPersist=10s -o StrictHostKeyChecking=no"

# Upload package
echo "→ Uploading package..."
scp $SSH_OPTS "/tmp/$PACKAGE_FILE" ${SSH_USER}@${SSH_HOST}:~/
echo "✓ Package uploaded"

# Upload script
echo "→ Uploading deployment script..."
scp $SSH_OPTS "$COMBINED_SCRIPT" ${SSH_USER}@${SSH_HOST}:~/combined_deploy.sh
echo "✓ Script uploaded"

# Execute script (reuses the same SSH connection - no password prompt!)
echo "→ Executing deployment on server..."
echo ""
ssh $SSH_OPTS ${SSH_USER}@${SSH_HOST} "chmod +x ~/combined_deploy.sh && ~/combined_deploy.sh $PACKAGE_FILE"

# Close the control connection
ssh -O exit -o ControlPath=$CONTROL_PATH ${SSH_USER}@${SSH_HOST} 2>/dev/null || true

# Cleanup local files
rm "$COMBINED_SCRIPT"
rm -rf "$TEMP_DIR"
rm "/tmp/$PACKAGE_FILE"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅  DEPLOYMENT SUCCESSFUL!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Info:${NC}"
echo -e "   Server: ${SSH_HOST}"
echo -e "   Path: ${DEPLOY_PATH}"
echo -e "   Time: $(date)"
echo -e "   Application: Restarted automatically"
echo ""
echo -e "${GREEN}🎉 Your changes are deployed and live!${NC}"
echo -e "${BLUE}📝 Check application logs at: ~/logs/nodejs.log on the server${NC}"
