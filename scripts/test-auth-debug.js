#!/usr/bin/env node

/**
 * Authentication Debug Script
 * Tests database connection and user authentication flow
 */

// Load environment variables
const fs = require('fs');
const path = require('path');

// Simple .env loader
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContents = fs.readFileSync(envPath, 'utf8');
    const lines = envContents.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

async function testAuthFlow() {
  console.log('🔍 AUTHENTICATION DEBUG SCRIPT');
  console.log('================================\n');

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbTest = await sql`SELECT COUNT(*) as count FROM members`;
    console.log(`✅ Database connected. Total members: ${dbTest.rows[0].count}\n`);

    // List all users (email only for privacy)
    console.log('👥 Existing users in database:');
    const users = await sql`SELECT id, email, user_name, created_at FROM members LIMIT 10`;
    
    if (users.rows.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You need to create a user first. Try signing up or creating a test user.\n');
      
      // Create a test user
      console.log('🛠️  Creating test user...');
      const testEmail = 'test@jamin.com';
      const testPassword = 'test123';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      await sql`
        INSERT INTO members (
          id, 
          user_name, 
          email, 
          password, 
          created_at
        )
        VALUES (
          gen_random_uuid(), 
          'testuser', 
          ${testEmail}, 
          ${hashedPassword}, 
          NOW()
        )
      `;
      
      console.log(`✅ Test user created: ${testEmail} / ${testPassword}`);
    } else {
      users.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.user_name}) - Created: ${user.created_at}`);
      });
    }

    console.log('\n🔐 Testing password verification for first user...');
    if (users.rows.length > 0) {
      const firstUser = users.rows[0];
      const userDetails = await sql`SELECT * FROM members WHERE email = ${firstUser.email}`;
      const user = userDetails.rows[0];
      
      console.log(`📧 Testing user: ${user.email}`);
      console.log(`🔑 Password hash exists: ${!!user.password}`);
      console.log(`📏 Hash length: ${user.password ? user.password.length : 0}`);
      
      // Test with a common password
      const testPasswords = ['password', 'test123', '123456', 'admin'];
      
      for (const testPwd of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPwd, user.password);
          console.log(`🧪 Testing password "${testPwd}": ${isValid ? '✅ MATCH' : '❌ No match'}`);
          if (isValid) break;
        } catch (error) {
          console.log(`❌ Error testing password "${testPwd}":`, error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Authentication debug failed:', error);
    
    if (error.message.includes('relation "members" does not exist')) {
      console.log('\n💡 SOLUTION: The members table does not exist. You need to create it first.');
      console.log('   Run your database migrations or create the table manually.');
    }
  }
}

testAuthFlow().catch(console.error);
