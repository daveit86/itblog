# Backup System Documentation

## Overview

The IT Blog now includes a **complete backup system** that saves both:
- ✅ **Database content** (articles, users, comments, versions)
- ✅ **Media files** (images in `public/uploads/`)

## Quick Start

### Create a Backup

```bash
npm run backup:create
```

This will:
1. Export all articles, users, and comments to JSON
2. Copy all media files from `public/uploads/`
3. Create a compressed archive in `backups/` directory
4. Generate a manifest file with metadata

**Output:** `backups/itblog-complete-backup-YYYY-MM-DD_HH-MM-SS.tar.gz`

### Restore from Backup

```bash
# List available backups
npm run backup:restore

# Restore specific backup
npm run backup:restore itblog-complete-backup-2026-03-16_21-30-00
```

This will:
1. Extract the archive
2. Clear existing database data
3. Restore all articles, users, and comments
4. Copy media files to `public/uploads/`

## Backup Contents

Each backup archive contains:

```
itblog-complete-backup-YYYY-MM-DD_HH-MM-SS.tar.gz
├── itblog-complete-backup-YYYY-MM-DD_HH-MM-SS.json  # Database export
├── uploads/                                          # Media files
│   ├── image1.jpg
│   ├── image2.png
│   └── ...
└── manifest.json                                     # Backup metadata
```

### manifest.json

```json
{
  "backupVersion": "2.0",
  "createdAt": "2026-03-16T21:30:00.000Z",
  "databaseFile": "itblog-complete-backup-2026-03-16_21-30-00.json",
  "includesMedia": true,
  "mediaPath": "uploads/",
  "restoreInstructions": [...]
}
```

## Manual Backup/Restore

### Manual Backup

If you prefer to do it manually:

```bash
# 1. Create backups directory
mkdir -p backups

# 2. Export database (using your own script or tool)
# You'll get a JSON file with all data

# 3. Copy media files
cp -r public/uploads backups/my-backup-uploads

# 4. Create archive
tar -czf backups/my-backup.tar.gz database.json backups/my-backup-uploads/
```

### Manual Restore

```bash
# 1. Extract archive
tar -xzf backups/my-backup.tar.gz

# 2. Import database (using Prisma or your preferred method)
# See scripts/restore-complete.sh for implementation

# 3. Copy media files
cp -r uploads/* public/uploads/
```

## Important Notes

### What's Included

✅ **Articles**: Title, content, slug, metadata, tags, SEO fields  
✅ **Comments**: All comment data (respects new anonymous format)  
✅ **Versions**: Article version history  
✅ **Users**: User accounts (skips if email already exists)  
✅ **Media Files**: All files in `public/uploads/`  

### What's NOT Included

❌ **Database connection settings** (uses your current .env)  
❌ **Application configuration**  
❌ **Environment variables**  
❌ **Logs and temporary files**  
❌ **Node modules**  

### Backup Storage

- **Location**: `backups/` directory (automatically created)
- **Format**: Compressed tar.gz archives
- **Naming**: `itblog-complete-backup-YYYY-MM-DD_HH-MM-SS.tar.gz`
- **Size**: Depends on number of articles and media files

### Security

⚠️ **IMPORTANT**:
- Backup files contain all your blog data
- Store backups securely
- Don't commit backups to git (they're in .gitignore by default)
- Consider encrypting backups if they contain sensitive data

## Troubleshooting

### "No .env file found!"

Make sure you have either `.env` or `.env.local` with `DATABASE_URL` set.

### "Database backup failed!"

Check that:
1. PostgreSQL is running
2. DATABASE_URL is correct in your .env file
3. You have permission to read from the database

### "Backup not found"

List available backups:
```bash
ls -la backups/
```

### Restore overwrites data?

**YES!** The restore script will:
- Delete all existing articles, comments, and versions
- Replace them with backup data
- Merge user accounts (skips existing emails)
- Add media files (doesn't overwrite existing ones)

**Always backup your current state before restoring!**

## Migration from Old Backups

If you have old backups (only JSON, no media):

1. **Check what media files are referenced**:
   ```bash
   grep -oE '/uploads/[^"]+' your-old-backup.json
   ```

2. **Locate the missing files** (if you have them elsewhere)

3. **Create new complete backup** once everything is restored

## Best Practices

1. **Backup regularly**: Before major changes, weekly, or monthly
2. **Test restores**: Periodically test that backups work
3. **Keep multiple backups**: Don't rely on just one backup
4. **Offsite storage**: Copy important backups to cloud storage
5. **Document**: Note what's in each backup

## Example Workflow

```bash
# Before major update
npm run backup:create

# Make your changes...

# If something goes wrong, restore
npm run backup:restore itblog-complete-backup-2026-03-16_21-30-00
```

## Support

If you encounter issues:
1. Check the error messages carefully
2. Verify your database connection
3. Ensure you have proper file permissions
4. Check that the backup archive isn't corrupted: `tar -tzf backup.tar.gz`
