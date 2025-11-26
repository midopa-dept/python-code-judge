import bcrypt from 'bcryptjs';
import { getPool } from './src/config/database.js';

async function createAdmin() {
  const pool = getPool();

  try {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 관리자 계정 생성
    const result = await pool.query(
      `
      INSERT INTO users (login_id, password_hash, name, email, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (login_id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
      RETURNING id, login_id, name, email, role
      `,
      ['admin', hashedPassword, '관리자', 'admin@test.com', 'super_admin']
    );

    console.log('관리자 계정 생성 완료:');
    console.log(result.rows[0]);

    // 학생 계정도 몇 개 생성
    const students = [
      { loginId: 'student1', name: '학생1', militaryId: '24-12345001', rank: '병장' },
      { loginId: 'student2', name: '학생2', militaryId: '24-12345002', rank: '상병' },
      { loginId: 'student3', name: '학생3', militaryId: '24-12345003', rank: '일병' },
    ];

    console.log('\n학생 계정 생성 중...');
    for (const student of students) {
      const studentPassword = await bcrypt.hash('student123', 10);
      const studentResult = await pool.query(
        `
        INSERT INTO users (login_id, password_hash, name, email, role, military_id, group_info)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (login_id) DO UPDATE SET
          password_hash = EXCLUDED.password_hash
        RETURNING id, login_id, name, role, military_id
        `,
        [
          student.loginId,
          studentPassword,
          student.name,
          `${student.loginId}@test.com`,
          'student',
          student.militaryId,
          student.rank,
        ]
      );
      console.log(`  - ${studentResult.rows[0].name} (${studentResult.rows[0].login_id}) 생성`);
    }

    console.log('\n초기 사용자 생성 완료!');
  } catch (error) {
    console.error('사용자 생성 중 오류:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdmin()
  .then(() => {
    console.log('\n스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('실행 중 오류:', error);
    process.exit(1);
  });
