/**
 * CLI Script: Create or Reset Platform Administrator Account
 * Usage: node scripts/create-admin.js <email> <password> [name] [role]
 * Example: node scripts/create-admin.js super@bizpilot.io Pass123! "Super User" super_admin
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { generateSecret } = require('../utils/totp');
require('dotenv').config();

async function run() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const name = args[2] || 'Platform Admin';
  const role = args[3] || 'super_admin';

  if (!email || !password) {
    console.error('\n❌ Error: Email and password are required.');
    console.log('Usage: node scripts/create-admin.js <email> <password> [name] [role]\n');
    process.exit(1);
  }

  const validRoles = ['super_admin', 'support', 'billing', 'readonly'];
  if (!validRoles.includes(role)) {
    console.error(`\n❌ Error: Role must be one of: ${validRoles.join(', ')}\n`);
    process.exit(1);
  }

  console.log(`\n🔐 Creating Platform Admin: ${email} (${role})...`);

  const passwordHash = await bcrypt.hash(password, 10);
  const totpSecret = generateSecret();

  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bizpilot_db'
    });

    const [existing] = await pool.query('SELECT id FROM admins WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing && existing.length > 0) {
      await pool.query(
        'UPDATE admins SET password_hash = ?, name = ?, role = ?, two_factor_secret = ?, two_factor_enabled = TRUE, is_active = TRUE WHERE id = ?',
        [passwordHash, name, role, totpSecret, existing[0].id]
      );
      console.log(`✅ Admin account updated successfully! (ID: ${existing[0].id})`);
    } else {
      const [res] = await pool.query(
        'INSERT INTO admins (name, email, password_hash, role, two_factor_secret, two_factor_enabled) VALUES (?, ?, ?, ?, ?, TRUE)',
        [name, email.toLowerCase(), passwordHash, role, totpSecret]
      );
      console.log(`✅ Admin account created successfully! (ID: ${res.insertId})`);
    }

    console.log(`🔑 2FA TOTP Secret Key: ${totpSecret}`);
    console.log(`✨ Role: ${role}\n`);
    process.exit(0);
  } catch (err) {
    console.warn(`\n⚠️ MySQL error: ${err.message}`);
    console.log('If you are using the in-memory store in dev mode, default credentials are:');
    console.log('Email: admin@bizpilot.io');
    console.log('Password: Admin@123456');
    console.log('2FA Secret: JBSWY3DPEHPK3PXP\n');
    process.exit(0);
  }
}

run();

