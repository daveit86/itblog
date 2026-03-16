#!/bin/bash

# IT Blog Complete Restore Script
# Restores both database (JSON) and media files (uploads/)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backup name provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: npm run backup:restore <backup-name>${NC}"
    echo ""
    echo "Available backups:"
    ls -1 backups/*.tar.gz 2>/dev/null | xargs -n1 basename | sed 's/.tar.gz//' | sed 's/^/  - /' || echo "  No backups found"
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_DIR="backups"
ARCHIVE_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Check if archive exists
if [ ! -f "${ARCHIVE_FILE}" ]; then
    echo -e "${RED}❌ Backup not found: ${ARCHIVE_FILE}${NC}"
    echo ""
    echo "Available backups:"
    ls -1 ${BACKUP_DIR}/*.tar.gz 2>/dev/null | xargs -n1 basename | sed 's/.tar.gz//' | sed 's/^/  - /' || echo "  No backups found"
    exit 1
fi

echo -e "${GREEN}🔄 Starting restore from: ${BACKUP_NAME}${NC}"
echo ""

# Create temporary directory
TMP_DIR=$(mktemp -d)
trap "rm -rf ${TMP_DIR}" EXIT

# Step 1: Extract archive
echo -e "${GREEN}📦 Extracting archive...${NC}"
tar -xzf "${ARCHIVE_FILE}" -C "${TMP_DIR}"

# Step 2: Check manifest
echo -e "${GREEN}📋 Reading manifest...${NC}"
if [ -f "${TMP_DIR}/manifest.json" ]; then
    cat "${TMP_DIR}/manifest.json"
    echo ""
else
    echo -e "${YELLOW}⚠️  No manifest found (legacy backup format)${NC}"
fi

# Step 3: Find database file
DB_FILE=$(find "${TMP_DIR}" -name "*.json" -not -name "manifest.json" | head -1)

if [ -z "${DB_FILE}" ]; then
    echo -e "${RED}❌ No database file found in backup!${NC}"
    exit 1
fi

echo -e "${GREEN}💾 Database file: $(basename ${DB_FILE})${NC}"

# Step 4: Confirm before restoring
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace your current database and media files!${NC}"
echo -e "${BLUE}   Database: ${DATABASE_URL:-'from .env'}${NC}"
echo -e "${BLUE}   Uploads:  public/uploads/${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

echo ""

# Step 5: Restore database
echo -e "${GREEN}💾 Restoring database...${NC}"

# Load environment
if [ -f ".env.local" ]; then
    source .env.local
elif [ -f ".env" ]; then
    source .env
fi

# Run restore script
node -e "
const { PrismaClient } = require('./generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function restore() {
  const backupData = JSON.parse(fs.readFileSync('${DB_FILE}', 'utf-8'));
  
  console.log('Backup created at:', backupData.exportedAt);
  console.log('Articles to restore:', backupData.articles?.length || 0);
  console.log('Users to restore:', backupData.users?.length || 0);
  console.log('');
  
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.comment.deleteMany({});
  await prisma.articleVersion.deleteMany({});
  await prisma.article.deleteMany({});
  
  // Restore articles
  console.log('Restoring articles...');
  for (const article of backupData.articles || []) {
    try {
      const { comments, versions, ...articleData } = article;
      
      const newArticle = await prisma.article.create({
        data: {
          ...articleData,
          createdAt: new Date(articleData.createdAt),
          updatedAt: new Date(articleData.updatedAt),
          publishAt: articleData.publishAt ? new Date(articleData.publishAt) : null,
        }
      });
      
      // Restore versions
      if (versions && versions.length > 0) {
        for (const version of versions) {
          await prisma.articleVersion.create({
            data: {
              ...version,
              articleId: newArticle.id,
              createdAt: new Date(version.createdAt),
            }
          });
        }
      }
      
      console.log('  ✓ Restored:', article.title);
    } catch (e) {
      console.error('  ✗ Failed:', article.title, '-', e.message);
    }
  }
  
  // Restore users (except if email already exists)
  if (backupData.users && backupData.users.length > 0) {
    console.log('');
    console.log('Restoring users...');
    for (const user of backupData.users) {
      try {
        const existing = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!existing) {
          await prisma.user.create({
            data: {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            }
          });
          console.log('  ✓ Restored user:', user.email);
        } else {
          console.log('  ⊘ Skipped (exists):', user.email);
        }
      } catch (e) {
        console.error('  ✗ Failed:', user.email, '-', e.message);
      }
    }
  }
  
  // Restore accounts (passwords)
  if (backupData.accounts && backupData.accounts.length > 0) {
    console.log('');
    console.log('Restoring accounts (passwords)...');
    for (const account of backupData.accounts) {
      try {
        // Check if user exists before restoring account
        const userExists = await prisma.user.findUnique({
          where: { id: account.userId }
        });
        
        if (userExists) {
          // Check if account already exists
          const existingAccount = await prisma.account.findFirst({
            where: { 
              userId: account.userId,
              provider: account.provider
            }
          });
          
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                ...account,
                expires_at: account.expires_at || null,
              }
            });
            console.log('  ✓ Restored account for user:', account.userId);
          } else {
            console.log('  ⊘ Skipped account (exists):', account.userId);
          }
        } else {
          console.log('  ⊘ Skipped account (user not found):', account.userId);
        }
      } catch (e) {
        console.error('  ✗ Failed account:', account.userId, '-', e.message);
      }
    }
  }
  
  console.log('');
  console.log('✅ Database restore complete!');
}

restore()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database restore failed!${NC}"
    exit 1
fi

echo ""

# Step 6: Restore media files
if [ -d "${TMP_DIR}/uploads" ]; then
    UPLOAD_COUNT=$(find "${TMP_DIR}/uploads" -type f | wc -l)
    
    if [ "$UPLOAD_COUNT" -gt 0 ]; then
        echo -e "${GREEN}📁 Restoring ${UPLOAD_COUNT} media files...${NC}"
        
        # Ensure uploads directory exists
        mkdir -p public/uploads
        
        # Copy files (preserving existing ones if any)
        cp -rn "${TMP_DIR}/uploads/"* public/uploads/ 2>/dev/null || true
        
        echo -e "${GREEN}✅ Media files restored to public/uploads/${NC}"
    else
        echo -e "${YELLOW}⚠️  No media files in backup${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No uploads directory in backup${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Restore complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Restart your dev server: npm run dev"
echo -e "  2. Check that your articles and images are restored"
echo -e "  3. Verify everything looks correct"
