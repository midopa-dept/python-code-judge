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

    // JOIN 쿼리 처리
    if (trimmedText.includes('FROM PROBLEMS P') && (trimmedText.includes('LEFT JOIN') || trimmedText.includes('JOIN'))) {
      // 문제 목록 조회 쿼리
      if (trimmedText.includes('P.ID, P.TITLE, P.SCORE, P.CATEGORY, P.DIFFICULTY')) {
        // 기본 쿼리 파싱
        const hasWhere = trimmedText.includes('WHERE');
        const whereClause = hasWhere ? text.match(/WHERE(.*)/i)?.[0] || '' : '';
        const limitMatch = text.match(/LIMIT\s+(\d+)/i);
        const offsetMatch = text.match(/OFFSET\s+(\d+)/i);

        // WHERE 절에서 파라미터 추출
        let newParams = [...params];
        if (hasWhere) {
          // whereClause에서 파라미터를 추출하고 실제 값으로 치환
          whereClause.replace(/\$(\d+)/g, (match, num) => {
            const index = parseInt(num) - 1;
            if (index < params.length) {
              newParams.push(params[index]);
            }
          });
        }

        // 실제 쿼리 실행
        let { data, error } = await client
          .from('problems')
          .select(`
            id,
            title,
            score,
            category,
            difficulty,
            visibility,
            submissions!inner(status)
          `)
          .eq('visibility', 'public') // 학생용은 public만
          .range(
            offsetMatch ? parseInt(offsetMatch[1]) : 0,
            limitMatch ? parseInt(limitMatch[1]) + (offsetMatch ? parseInt(offsetMatch[1]) : 0) - 1 : 19
          );

        if (error) {
          console.error('Supabase 쿼리 에러:', error);
          return { rows: [] };
        }

        // 결과 처리
        const groupedData = data.reduce((acc, curr) => {
          const existing = acc.find(item => item.id === curr.id);
          if (!existing) {
            acc.push({
              ...curr,
              submission_count: 1,
              accuracy_rate: 0 // 실제 계산 로직 필요
            });
          } else {
            existing.submission_count += 1;
          }
          return acc;
        }, []);

        return { rows: groupedData };
      }
    }

    // COUNT 쿼리 특별 처리
    if (trimmedText.includes('COUNT(*)') && trimmedText.includes('FROM PROBLEMS')) {
      const { count, error } = await client
        .from('problems')
        .select('*', { count: 'exact', head: true });

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
