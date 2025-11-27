import { spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { config } from '../../config/env.js';
import AppError from '../errors/AppError.js';
const ALLOWED_MODULES = new Set([
  'math',
  'random',
  'itertools',
  'collections',
  'string',
  're',
  'datetime',
  'json',
]);
const BANNED_MODULES = new Set(['os', 'subprocess', 'socket', 'urllib', 'eval', 'exec', 'importlib']);
const BANNED_FUNCTIONS = new Set(['eval', 'exec', '__import__', 'compile']);

const buildAnalyzerScript = (codeFilePath) => `
import ast
import json
import sys

ALLOWED_MODULES = set(${JSON.stringify([...ALLOWED_MODULES])})
BANNED_MODULES = set(${JSON.stringify([...BANNED_MODULES])})
BANNED_FUNCTIONS = set(${JSON.stringify([...BANNED_FUNCTIONS])})

try:
    with open(r"${codeFilePath}", "r", encoding="utf-8") as f:
        code = f.read()
except Exception as exc:
    print(json.dumps({"status": "SE", "message": f"파일 읽기 실패: {str(exc)}"}))
    sys.exit(0)

try:
    tree = ast.parse(code)
except SyntaxError as exc:
    print(json.dumps({"status": "SE", "message": str(exc)}))
    sys.exit(0)

errors = []

def record_error(error_type, target, lineno):
    errors.append({"type": error_type, "target": target, "lineno": lineno})

def check_module(name, lineno):
    base = name.split('.')[0] if name else ''
    if not base:
        record_error("UNAUTHORIZED_MODULE", ".", lineno)
        return
    if base in BANNED_MODULES:
        record_error("BANNED_MODULE", base, lineno)
    elif base not in ALLOWED_MODULES:
        record_error("UNAUTHORIZED_MODULE", base, lineno)

class Analyzer(ast.NodeVisitor):
    def visit_Import(self, node):
        for alias in node.names:
            check_module(alias.name, node.lineno)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        check_module(node.module, node.lineno)
        for alias in node.names:
            if alias.name in BANNED_FUNCTIONS:
                record_error("BANNED_FUNCTION", alias.name, node.lineno)
        self.generic_visit(node)

    def visit_Call(self, node):
        func_name = None
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
            if isinstance(node.func.value, ast.Name) and node.func.value.id == "importlib":
                record_error("BANNED_FUNCTION", f"importlib.{func_name}", node.lineno)
        if func_name in BANNED_FUNCTIONS:
            record_error("BANNED_FUNCTION", func_name, node.lineno)
        self.generic_visit(node)

Analyzer().visit(tree)

if errors:
    print(json.dumps({"status": "REJECTED", "errors": errors}))
else:
    print(json.dumps({"status": "OK"}))
`;

const normalizeExecutables = (options) => {
  const candidates = [];
  if (options?.pythonExecutables?.length) {
    candidates.push(...options.pythonExecutables);
  } else {
    candidates.push(options?.pythonExecutable || config.judging.pythonExecutable || 'python');
  }
  return [...new Set(candidates.filter(Boolean))];
};

const parsePythonResult = (stdout) => {
  if (!stdout) {
    throw new AppError('AST 분석 결과가 비어 있습니다.', 500, 'AST_EMPTY_OUTPUT');
  }
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new AppError('AST 분석 결과 파싱에 실패했습니다.', 500, 'AST_PARSE_ERROR');
  }
};

/**
 * Python 코드에 대한 AST 정적 분석을 수행합니다.
 * @param {string} code 분석 대상 코드
 * @param {object} options 실행 옵션
 * @returns {{status: string, passed: boolean, errors?: Array, message?: string}}
 */
export const analyzePythonCode = (code, options = {}) => {
  if (typeof code !== 'string') {
    throw new AppError('코드는 문자열이어야 합니다.', 400, 'INVALID_CODE_TYPE');
  }

  const maxBytes = options.maxBytes || config.judging.maxCodeBytes;
  const byteLength = Buffer.byteLength(code, 'utf8');
  if (byteLength > maxBytes) {
    return {
      status: 'REJECTED',
      reason: 'SIZE_LIMIT_EXCEEDED',
      passed: false,
      message: `코드 크기 제한 ${maxBytes}바이트를 초과했습니다.`,
    };
  }

  // 임시 파일 생성
  const tmpFile = join(tmpdir(), `python-code-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);

  try {
    // 코드를 임시 파일에 쓰기
    writeFileSync(tmpFile, code, 'utf8');

    const analyzerScript = buildAnalyzerScript(tmpFile);
    const executables = normalizeExecutables(options);
    let lastError;

    for (const exe of executables) {
      const result = spawnSync(exe, ['-c', analyzerScript], {
        encoding: 'utf8',
      });

      if (result.error) {
        lastError = result.error;
        continue;
      }

      const stdout = (result.stdout || '').trim();
      const stderr = (result.stderr || '').trim();

      if (!stdout) {
        // stdout이 비어있으면 stderr 확인
        if (stderr) {
          console.error(`[AST Validator] Python stderr: ${stderr}`);
          lastError = new Error(`Python 실행 오류: ${stderr}`);
          continue;
        }
        lastError = new Error('Python 실행 결과가 비어있습니다.');
        continue;
      }

      const payload = parsePythonResult(stdout);

      if (payload.status === 'OK') {
        return { status: 'OK', passed: true };
      }

      if (payload.status === 'SE') {
        return {
          status: 'SE',
          passed: false,
          message: payload.message || '문법 오류가 감지되었습니다.',
        };
      }

      if (payload.status === 'REJECTED') {
        return {
          status: 'REJECTED',
          passed: false,
          errors: payload.errors || [],
        };
      }

      return {
        status: 'REJECTED',
        passed: false,
        message: '알 수 없는 AST 분석 결과입니다.',
      };
    }

    if (lastError) {
      throw new AppError(
        'Python 실행 파일을 찾지 못했습니다. PYTHON_EXECUTABLE 설정을 확인하세요.',
        500,
        'PYTHON_EXEC_NOT_FOUND'
      );
    }

    throw new AppError('AST 분석을 수행하지 못했습니다.', 500, 'AST_EXECUTION_FAILED');
  } finally {
    // 임시 파일 삭제
    try {
      unlinkSync(tmpFile);
    } catch (err) {
      // 임시 파일 삭제 실패는 무시
    }
  }
};

export default analyzePythonCode;
