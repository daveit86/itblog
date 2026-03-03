/**
 * Security Setup Script
 * 
 * Run this script to generate secure secrets:
 * node scripts/setup-security.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generatePassword(length = 32) {
  // Generate a memorable but secure password
  const words = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot', 'Secure', 'Strong', 'Safe', 'Guard'];
  const numbers = Math.floor(1000 + Math.random() * 9000);
  const special = '!@#$%^&*';
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const specialChar = special[Math.floor(Math.random() * special.length)];
  return `${word1}${word2}${numbers}${specialChar}`;
}

console.log('🔐 Generating secure secrets...\n');

const secrets = {
  NEXTAUTH_SECRET: generateSecret(64),
  ADMIN_PASSWORD: generatePassword(),
  ENCRYPTION_KEY: generateSecret(32),
};

console.log('Generated Secrets:');
console.log('==================\n');
console.log(`NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET}`);
console.log(`ADMIN_PASSWORD=${secrets.ADMIN_PASSWORD}`);
console.log(`ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}`);
console.log('\n==================\n');

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Copy these values to your .env.local file (not .env!)');
console.log('2. Never commit .env.local to git');
console.log('3. Use a strong, unique password for the admin account');
console.log('4. Change the admin password after first login');
console.log('5. Store these secrets in a password manager');
console.log('\n📝 To apply these secrets:');
console.log('1. Create .env.local in your project root');
console.log('2. Add the secrets above');
console.log('3. Update ADMIN_EMAIL with your email');
console.log('4. Restart your Next.js server');
