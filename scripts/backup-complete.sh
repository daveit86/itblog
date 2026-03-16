#!/bin/bash

# IT Blog Complete Backup Script
# Backs up both database (JSON) and media files (uploads/)

set -e

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="itblog-complete-backup-${TIMESTAMP}"
DB_BACKUP_FILE="${BACKUP_NAME}.json"
ARCHIVE_FILE="${BACKUP_NAME}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting complete backup...${NC}"

# Create backups directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Step 1: Check if running locally or production
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📍 Detected local environment${NC}"
    source .env.local
elif [ -f ".env" ]; then
    echo -e "${YELLOW}📍 Using .env configuration${NC}"
    source .env
else
    echo -e "${RED}❌ No .env file found!${NC}"
    exit 1
fi

# Step 2: Database backup
echo -e "${GREEN}💾 Backing up database...${NC}"

# Create temporary directory for backup
TMP_DIR=$(mktemp -d)
trap "rm -rf ${TMP_DIR}" EXIT

# Export database using Node.js script
node -e "
const { PrismaClient } = require('./generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function backup() {
  console.log('Fetching articles...');
  const articles = await prisma.article.findMany({
    include: {
      comments: true,
      versions: true,
    },
  });
  
  console.log('Fetching users...');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      bio: true,
      notifyOnComments: true,
      notifyOnPublish: true,
      createdAt: true,
      updatedAt: true,
    }
  });
  
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    articles: articles,
    users: users,
  };
  
  fs.writeFileSync('${TMP_DIR}/${DB_BACKUP_FILE}', JSON.stringify(backup, null, 2));
  console.log('Database backup saved:', '${DB_BACKUP_FILE}');
}

backup()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database backup failed!${NC}"
    exit 1
fi

# Step 3: Copy media files
echo -e "${GREEN}📁 Backing up media files...${NC}"

if [ -d "public/uploads" ]; then
    UPLOAD_COUNT=$(find public/uploads -type f ! -name ".gitkeep" | wc -l)
    echo -e "${YELLOW}Found ${UPLOAD_COUNT} media files${NC}"
    
    # Copy uploads to temp directory
    cp -r public/uploads "${TMP_DIR}/uploads"
    
    # Remove .gitkeep from backup
    rm -f "${TMP_DIR}/uploads/.gitkeep"
else
    echo -e "${YELLOW}⚠️  No uploads directory found${NC}"
    mkdir -p "${TMP_DIR}/uploads"
fi

# Step 4: Create manifest file
echo -e "${GREEN}📝 Creating backup manifest...${NC}"

cat > "${TMP_DIR}/manifest.json" << MANIFEST
{
  "backupVersion": "2.0",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "databaseFile": "${DB_BACKUP_FILE}",
  "includesMedia": true,
  "mediaPath": "uploads/",
  "restoreInstructions": [
    "1. Extract this archive",
    "2. Run: npm run backup:restore ${BACKUP_NAME}",
    "3. Or manually import JSON and copy uploads/"
  ]
}
MANIFEST

# Step 5: Create tar.gz archive
echo -e "${GREEN}📦 Creating archive...${NC}"
cd "${TMP_DIR}"
tar -czf "${ARCHIVE_FILE}" \
    "${DB_BACKUP_FILE}" \
    "uploads/" \
    "manifest.json"
cd - > /dev/null

# Move archive to backup directory
mv "${TMP_DIR}/${ARCHIVE_FILE}" "${BACKUP_DIR}/"

# Cleanup
rm -rf "${TMP_DIR}"

echo -e "${GREEN}✅ Backup complete!${NC}"
echo -e "${GREEN}📂 Location: ${BACKUP_DIR}/${ARCHIVE_FILE}${NC}"
echo ""
echo -e "${YELLOW}To restore this backup:${NC}"
echo -e "  npm run backup:restore ${BACKUP_NAME}"
echo ""
echo -e "${YELLOW}Or manually:${NC}"
echo -e "  1. tar -xzf ${BACKUP_DIR}/${ARCHIVE_FILE}"
echo -e "  2. Import JSON to database"
echo -e "  3. Copy uploads/ to public/uploads/"
