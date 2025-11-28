import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabaseClient = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('Supabase client created');
  }
  return supabaseClient;
};

// SQL 쿼리를 Supabase 쿼리로 변환하는 헬퍼 함수
const parseAndExecuteQuery = async (client, text, params) => {
  const trimmedText = text.trim().toUpperCase();

  // SELECT 쿼리 처리
  if (trimmedText.startsWith('SELECT')) {
    // SELECT id FROM users WHERE login_id = $1
    if (text.includes('FROM users') && text.includes('WHERE login_id =')) {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('login_id', params[0])
        .limit(1);

      if (error) throw error;
      return { rows: data || [] };
    }

    // SELECT * FROM users WHERE id = $1
    if (text.includes('FROM users') && text.includes('WHERE id =')) {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', params[0])
        .limit(1);

      if (error) throw error;
      return { rows: data || [] };
    }

    // SELECT NOW()
    if (trimmedText.includes('NOW()')) {
      return { rows: [{ current_time: new Date().toISOString() }] };
    }
  }

  // INSERT 쿼리 처리
  if (trimmedText.includes('INSERT INTO USERS')) {
    // login_id, name, password_hash, email, group_info, role, account_status 순서
    const insertData = {
      login_id: params[0],
      name: params[1],
      password_hash: params[2],
      email: params[3] || null,
      group_info: params[4] || null,
      role: text.includes("'student'") ? 'student' : 'admin',
      account_status: 'active'
    };

    const { data, error } = await client
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return { rows: [data] };
  }

  // UPDATE 쿼리 처리
  if (trimmedText.startsWith('UPDATE') && trimmedText.includes('USERS')) {
    // UPDATE users SET last_login = NOW() WHERE id = $1
    if (trimmedText.includes('LAST_LOGIN')) {
      const { data, error } = await client
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', params[0])
        .select();

      if (error) throw error;
      return { rows: data || [] };
    }

    // UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2
    if (trimmedText.includes('PASSWORD_HASH')) {
      const updateData = {
        password_hash: params[0],
        updated_at: new Date().toISOString()
      };
      const userId = params[1];

      const { data, error } = await client
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { rows: data || [] };
    }
  }

  // INSERT INTO audit_logs
  if (trimmedText.startsWith('INSERT INTO AUDIT_LOGS')) {
    const insertData = {
      user_id: params[0] || null,
      user_role: params[1] || null,
      action_type: params[2],
      target_resource: params[3] || null,
      ip_address: params[4] || null,
      user_agent: params[5] || null,
      result: params[6],
      error_message: params[7] || null
    };

    const { data, error } = await client
      .from('audit_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return { rows: [data] };
  }

  // 복잡한 쿼리 - 직접 Supabase 쿼리로 변환
  if (trimmedText.startsWith('SELECT')) {
    console.log('⚠️  복잡한 SELECT 쿼리 - 직접 변환 시도:', text.substring(0, 100));

    // 문제 목록 쿼리 (JOIN 포함)
    if (trimmedText.includes('FROM PROBLEMS P') && trimmedText.includes('LEFT JOIN') &&
        trimmedText.includes('P.ID, P.TITLE, P.SCORE, P.CATEGORY, P.DIFFICULTY')) {

      // 현재 사용자 ID 파라미터 추출
      const userId = params[params.length - 3] || params[params.length - 1]; // 쿼리에 따라 다를 수 있음

      // 기본 쿼리 실행: 문제 정보 가져오기
      let queryBuilder = client
        .from('problems')
        .select(`
          id,
          title,
          score,
          category,
          difficulty,
          visibility,
          created_at
        `)
        .order('created_at', { ascending: false });

      // 필터 적용 (WHERE 절)
      if (trimmedText.includes('WHERE')) {
        const whereClause = text.substring(text.toUpperCase().indexOf('WHERE') + 5);

        // 카테고리 필터
        if (whereClause.includes('P.CATEGORY')) {
          const categoryMatch = whereClause.match(/P\.CATEGORY\s*=\s*\$([0-9]+)/i);
          if (categoryMatch) {
            const paramIndex = parseInt(categoryMatch[1]) - 1;
            if (paramIndex < params.length) {
              queryBuilder = queryBuilder.eq('category', params[paramIndex]);
            }
          }
        }

        // 난이도 필터
        if (whereClause.includes('P.DIFFICULTY')) {
          const difficultyMatch = whereClause.match(/P\.DIFFICULTY\s*=\s*\$([0-9]+)/i);
          if (difficultyMatch) {
            const paramIndex = parseInt(difficultyMatch[1]) - 1;
            if (paramIndex < params.length) {
              queryBuilder = queryBuilder.eq('difficulty', params[paramIndex]);
            }
          }
        }

        // 검색어 필터
        if (whereClause.includes('P.TITLE') && whereClause.includes('ILIKE')) {
          const searchMatch = whereClause.match(/P\.TITLE\s+ILIKE\s+\$([0-9]+)/i);
          if (searchMatch) {
            const paramIndex = parseInt(searchMatch[1]) - 1;
            if (paramIndex < params.length) {
              const searchTerm = params[paramIndex].replace(/%/g, '');
              queryBuilder = queryBuilder.ilike('title', `%${searchTerm}%`);
            }
          }
        }

        // 가시성 필터 (학생용)
        if (trimmedText.includes('P.VISIBILITY = \'public\'')) {
          queryBuilder = queryBuilder.eq('visibility', 'public');
        }
      }

      // 페이징 처리
      const limitMatch = text.match(/LIMIT\s+(\d+)/i);
      const offsetMatch = text.match(/OFFSET\s+(\d+)/i);

      if (offsetMatch && limitMatch) {
        const offset = parseInt(offsetMatch[1]);
        const limit = parseInt(limitMatch[1]);
        queryBuilder = queryBuilder.range(offset, offset + limit - 1);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('문제 목록 쿼리 에러:', error);
        return { rows: [] };
      }

      // 결과에 통계 정보 추가 (기본값)
      const processedData = data.map(problem => ({
        ...problem,
        accuracy_rate: 0, // 실제 계산 로직 필요
        submission_count: 0, // 실제 제출 수 계산 로직 필요
        is_solved: false // 실제 해결 여부 확인 로직 필요
      }));

      return { rows: processedData };
    }

    // COUNT 쿼리 특별 처리
    if (trimmedText.includes('COUNT(*)') && trimmedText.includes('FROM PROBLEMS')) {
      let queryBuilder = client
        .from('problems')
        .select('*', { count: 'exact', head: true });

      // 필터 적용
      if (trimmedText.includes('WHERE')) {
        const whereClause = text.substring(text.toUpperCase().indexOf('WHERE') + 5);

        // 가시성 필터
        if (whereClause.includes('P.VISIBILITY')) {
          const visibilityMatch = whereClause.match(/P\.VISIBILITY\s*=\s*'([^']+)'/i);
          if (visibilityMatch) {
            queryBuilder = queryBuilder.eq('visibility', visibilityMatch[1]);
          }
        }

        // 카테고리 필터
        if (whereClause.includes('P.CATEGORY')) {
          const categoryMatch = whereClause.match(/P\.CATEGORY\s*=\s*\$([0-9]+)/i);
          if (categoryMatch) {
            const paramIndex = parseInt(categoryMatch[1]) - 1;
            if (paramIndex < params.length) {
              queryBuilder = queryBuilder.eq('category', params[paramIndex]);
            }
          }
        }
      }

      const { count, error } = await queryBuilder;

      if (error) {
        console.error('COUNT 쿼리 에러:', error);
        return { rows: [{ total: 0 }] };
      }

      return { rows: [{ total: count || 0 }] };
    }

    // exec_sql RPC 함수가 없을 경우 기본값 반환
    console.log('⚠️  복잡한 쿼리 직접 변환: 기본값 반환');
    return { rows: [] };
  }

  throw new Error(`Unsupported query: ${text.substring(0, 100)}`);
};

// SQL 쿼리를 Supabase 쿼리로 변환하여 실행
export const query = async (text, params) => {
  const client = getSupabaseClient();

  try {
    return await parseAndExecuteQuery(client, text, params);
  } catch (error) {
    console.error('Query error:', error.message);
    console.error('Query was:', text);
    console.error('Params were:', params);
    throw error;
  }
};

export const getClient = async () => {
  // Supabase client를 반환 (pg client와 호환성을 위해)
  const client = getSupabaseClient();
  return {
    query: async (text, params) => query(text, params),
    release: () => {}, // Supabase는 connection pool 관리가 자동
  };
};

export const testDatabaseConnection = async () => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('users').select('count').limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export const closePool = async () => {
  // Supabase client는 명시적으로 close할 필요 없음
  console.log('Supabase client cleanup (no-op)');
};
