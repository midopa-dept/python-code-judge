import http from 'http';

// HTTP 요청 헬퍼 함수
function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 테스트 실행
async function runTests() {
  console.log('=== Phase 2: 사용자 관리 모듈 API 테스트 ===\n');

  let adminToken = null;
  let studentToken = null;
  let studentId = null;

  try {
    // 1. 관리자 로그인
    console.log('1️⃣ 관리자 로그인 테스트');
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      loginId: 'admin',
      password: 'admin1234'
    });

    if (adminLoginRes.status === 200) {
      // 응답 구조에서 token 또는 accessToken 찾기
      adminToken = adminLoginRes.data.data.token || adminLoginRes.data.data.accessToken;
      console.log('✅ 관리자 로그인 성공');
      if (adminToken) {
        console.log(`   토큰: ${adminToken.substring(0, 30)}...`);
      } else {
        console.log('   응답 구조:', JSON.stringify(adminLoginRes.data, null, 2));
        return;
      }
    } else {
      console.log('❌ 관리자 로그인 실패:', adminLoginRes.data);
      return;
    }

    // 2. 학생 로그인
    console.log('\n2️⃣ 학생 로그인 테스트');
    const studentLoginRes = await makeRequest('/api/auth/login', 'POST', {
      loginId: 'student1',
      password: 'student1234'
    });

    if (studentLoginRes.status === 200) {
      studentToken = studentLoginRes.data.data.token || studentLoginRes.data.data.accessToken;
      studentId = studentLoginRes.data.data.user.id;
      console.log('✅ 학생 로그인 성공');
      console.log(`   학생 ID: ${studentId} (타입: ${typeof studentId})`);
      console.log(`   전체 사용자 정보:`, JSON.stringify(studentLoginRes.data.data.user, null, 2));
      if (studentToken) {
        console.log(`   토큰: ${studentToken.substring(0, 30)}...`);
      }
    } else {
      console.log('❌ 학생 로그인 실패:', studentLoginRes.data);
      return;
    }

    // 3. GET /api/users/students - 학생 목록 조회 (관리자)
    console.log('\n3️⃣ GET /api/users/students - 학생 목록 조회 (관리자 권한)');
    const studentsListRes = await makeRequest('/api/users/students', 'GET', null, adminToken);

    if (studentsListRes.status === 200) {
      console.log('✅ 학생 목록 조회 성공');
      console.log(`   전체 학생 수: ${studentsListRes.data.data.pagination.totalItems}`);
      console.log(`   현재 페이지: ${studentsListRes.data.data.pagination.currentPage}`);
      console.log(`   학생 목록 (첫 3명):`);
      studentsListRes.data.data.students.slice(0, 3).forEach(s => {
        console.log(`     - ID: ${s.id}, 이름: ${s.name}, 군번: ${s.militaryId}, 그룹: ${s.groupInfo}`);
      });
    } else {
      console.log('❌ 학생 목록 조회 실패:', studentsListRes.data);
    }

    // 4. GET /api/users/students - 페이지네이션 테스트
    console.log('\n4️⃣ GET /api/users/students?page=1&limit=2 - 페이지네이션 테스트');
    const paginationRes = await makeRequest('/api/users/students?page=1&limit=2', 'GET', null, adminToken);

    if (paginationRes.status === 200) {
      console.log('✅ 페이지네이션 성공');
      console.log(`   페이지당 개수: ${paginationRes.data.data.pagination.limit}`);
      console.log(`   조회된 학생 수: ${paginationRes.data.data.students.length}`);
    } else {
      console.log('❌ 페이지네이션 실패:', paginationRes.data);
    }

    // 5. GET /api/users/students - 검색 기능 테스트 (groupInfo 필터)
    console.log('\n5️⃣ GET /api/users/students?groupInfo=1소대 - 검색 기능 테스트');
    const searchRes = await makeRequest('/api/users/students?groupInfo=' + encodeURIComponent('1소대'), 'GET', null, adminToken);

    if (searchRes.status === 200) {
      console.log('✅ 검색 기능 성공');
      console.log(`   검색 결과 수: ${searchRes.data.data.students.length}`);
      if (searchRes.data.data.students.length > 0) {
        console.log(`   첫 번째 결과: ${searchRes.data.data.students[0].name} (${searchRes.data.data.students[0].groupInfo})`);
      }
    } else {
      console.log('❌ 검색 기능 실패:', searchRes.data);
    }

    // 6. GET /api/users/students - 학생이 목록 조회 시도 (실패해야 함)
    console.log('\n6️⃣ GET /api/users/students - 학생 권한으로 목록 조회 (실패 예상)');
    const studentListAttempt = await makeRequest('/api/users/students', 'GET', null, studentToken);

    if (studentListAttempt.status === 403) {
      console.log('✅ 권한 검증 성공 (학생은 목록 조회 불가)');
      console.log(`   오류 메시지: ${studentListAttempt.data.message}`);
    } else {
      console.log('❌ 권한 검증 실패 (학생이 목록 조회 가능함)');
    }

    // 7. GET /api/users/students/:id - 본인 정보 조회 (학생)
    console.log(`\n7️⃣ GET /api/users/students/${studentId} - 학생이 본인 정보 조회`);
    const ownInfoRes = await makeRequest(`/api/users/students/${studentId}`, 'GET', null, studentToken);

    if (ownInfoRes.status === 200) {
      console.log('✅ 본인 정보 조회 성공');
      console.log(`   이름: ${ownInfoRes.data.data.name}`);
      console.log(`   군번: ${ownInfoRes.data.data.militaryId}`);
      console.log(`   그룹: ${ownInfoRes.data.data.groupInfo}`);
      console.log(`   통계:`);
      console.log(`     - 총 제출 수: ${ownInfoRes.data.data.statistics.totalSubmissions}`);
      console.log(`     - 해결한 문제: ${ownInfoRes.data.data.statistics.solvedProblems}`);
      console.log(`     - 정확도: ${ownInfoRes.data.data.statistics.accuracyRate}%`);
    } else {
      console.log('❌ 본인 정보 조회 실패:', ownInfoRes.data);
    }

    // 8. GET /api/users/students/:id - 관리자가 학생 정보 조회
    console.log(`\n8️⃣ GET /api/users/students/${studentId} - 관리자가 학생 정보 조회`);
    const adminViewRes = await makeRequest(`/api/users/students/${studentId}`, 'GET', null, adminToken);

    if (adminViewRes.status === 200) {
      console.log('✅ 관리자 조회 성공');
      console.log(`   이름: ${adminViewRes.data.data.name}`);
      console.log(`   계정 상태: ${adminViewRes.data.data.accountStatus}`);
    } else {
      console.log('❌ 관리자 조회 실패:', adminViewRes.data);
    }

    // 9. GET /api/users/students/:id - 학생이 타인 정보 조회 시도 (실패 예상)
    console.log('\n9️⃣ GET /api/users/students/999 - 학생이 타인 정보 조회 (실패 예상)');
    const otherStudentRes = await makeRequest('/api/users/students/999', 'GET', null, studentToken);

    if (otherStudentRes.status === 403) {
      console.log('✅ 권한 검증 성공 (타인 정보 조회 불가)');
      console.log(`   오류 메시지: ${otherStudentRes.data.message}`);
    } else if (otherStudentRes.status === 404) {
      console.log('⚠️ 학생을 찾을 수 없음 (권한 검증은 통과)');
    } else {
      console.log('❌ 권한 검증 실패');
    }

    // 10. GET /api/users/students/:id - 존재하지 않는 학생 조회
    console.log('\n🔟 GET /api/users/students/99999 - 존재하지 않는 학생 조회');
    const notFoundRes = await makeRequest('/api/users/students/99999', 'GET', null, adminToken);

    if (notFoundRes.status === 404) {
      console.log('✅ 404 처리 성공');
      console.log(`   오류 메시지: ${notFoundRes.data.message}`);
    } else {
      console.log('❌ 404 처리 실패');
    }

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('\n테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
runTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('실행 중 오류:', error);
  process.exit(1);
});
