/**
 * 데이터베이스 초기화 스크립트
 * 통합 스키마(schema-unified.sql)와 시드 데이터(seeds-unified.sql) 적용
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'claude0729',
});

async function resetDatabase() {
  try {
    await client.connect();
    console.log('✓ 데이터베이스 연결 성공');

    // 1. 통합 스키마 적용
    console.log('\n[1] 통합 스키마 적용 중...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema-unified.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSQL);
    console.log('✓ 스키마 적용 완료');

    // 2. 시드 데이터 적용
    console.log('\n[2] 시드 데이터 적용 중...');
    const seedsPath = path.join(__dirname, '..', 'database', 'seeds-unified.sql');
    const seedsSQL = fs.readFileSync(seedsPath, 'utf8');
    await client.query(seedsSQL);
    console.log('✓ 시드 데이터 적용 완료');

    // 3. 데이터 확인
    console.log('\n[3] 데이터 확인...');

    const usersResult = await client.query('SELECT id, login_id, name, role FROM users ORDER BY id');
    console.log('\n사용자 목록:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.login_id} (${user.name}) - ${user.role}`);
    });

    const problemsResult = await client.query('SELECT COUNT(*) as count FROM problems');
    console.log(`\n문제 수: ${problemsResult.rows[0].count}`);

    const sessionsResult = await client.query('SELECT COUNT(*) as count FROM education_sessions');
    console.log(`세션 수: ${sessionsResult.rows[0].count}`);

    const auditResult = await client.query('SELECT COUNT(*) as count FROM audit_logs');
    console.log(`감사 로그 수: ${auditResult.rows[0].count}`);

    console.log('\n✓ 데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('✗ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

resetDatabase();
