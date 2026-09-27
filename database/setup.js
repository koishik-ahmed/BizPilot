const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'bizpilot_db';

async function runSetup() {
  console.log('🚀 Starting BizPilot Database Setup...');
  console.log(`Connecting to MySQL on ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

  let connection;
  try {
    // 1. Connect without database first to ensure it exists
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server.');

    // 2. Create Database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`✅ Database \`${DB_NAME}\` ensured.`);

    await connection.query(`USE \`${DB_NAME}\`;`);

    // 3. Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✅ Schema executed successfully. All tables created.');
    }

    // 4. Read and execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✅ Seed data inserted successfully.');
    }

    console.log('🎉 BizPilot Database setup completed successfully!');
  } catch (err) {
    console.error('⚠️ MySQL Setup Encountered Error:', err.message);
    console.log('ℹ️ Note: BizPilot backend is also equipped with an automated hybrid data engine that falls back smoothly to in-memory persistence if MySQL authentication requires specific custom credentials.');
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runSetup();
}

module.exports = { runSetup };

