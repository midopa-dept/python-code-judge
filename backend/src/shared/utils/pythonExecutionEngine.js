import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { config } from '../../config/env.js';
import AppError from '../errors/AppError.js';
import crypto from 'crypto';

const buildRunnerScript = () => `
import subprocess
import sys
import time
import json
import psutil
import os

code_path = sys.argv[1]
time_limit = float(sys.argv[2])
mem_limit_mb = int(sys.argv[3])
workdir = sys.argv[4]

input_data = sys.stdin.read()

try:
    proc = subprocess.Popen(
        [sys.executable, code_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=workdir,
    )
except Exception as exc:
    print(json.dumps({\"status\": \"RE\", \"stdout\": \"\", \"stderr\": str(exc), \"timeMs\": 0, \"memoryBytes\": 0, \"returnCode\": -1}))
    sys.exit(0)

try:
    if input_data:
        proc.stdin.write(input_data)
    proc.stdin.close()
except Exception:
    pass

start_time = time.time()
peak_memory = 0
timed_out = False
mem_exceeded = False

try:
    ps_proc = psutil.Process(proc.pid)
except Exception:
    ps_proc = None

while True:
    if proc.poll() is not None:
        break
    if ps_proc:
        try:
            mem = ps_proc.memory_info().rss
            if mem > peak_memory:
                peak_memory = mem
            if mem > mem_limit_mb * 1024 * 1024:
                mem_exceeded = True
                proc.kill()
                break
        except psutil.NoSuchProcess:
            break
        except Exception:
            pass
    if time.time() - start_time > time_limit:
        timed_out = True
        proc.kill()
        break
    time.sleep(0.01)

try:
    stdout, stderr = proc.communicate(timeout=0.1)
except subprocess.TimeoutExpired:
    stdout, stderr = '', ''

duration_ms = int((time.time() - start_time) * 1000)

status = 'OK'
if timed_out:
    status = 'TLE'
elif mem_exceeded:
    status = 'MLE'
elif proc.returncode not in (0, None):
    status = 'RE'

result = {
    \"status\": status,
    \"stdout\": stdout,
    \"stderr\": stderr,
    \"timeMs\": duration_ms,
    \"memoryBytes\": peak_memory,
    \"returnCode\": proc.returncode,
}
print(json.dumps(result))
`;

const clampTimeout = (value) => {
  if (Number.isNaN(value) || value <= 0) return config.judging.defaultTimeoutSeconds;
  return Math.min(Math.max(value, config.judging.minTimeoutSeconds), config.judging.maxTimeoutSeconds);
};

const ensureTempDir = async (baseDir) => {
  const resolved = path.resolve(baseDir);
  await fs.promises.mkdir(resolved, { recursive: true });
  const unique = crypto.randomBytes(8).toString('hex');
  return fs.promises.mkdtemp(path.join(resolved, `run-${unique}-`));
};

const removeDirSafe = async (dirPath) => {
  try {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    // swallow cleanup errors
  }
};

const parseRunnerOutput = (raw) => {
  if (!raw) {
    throw new AppError('실행 엔진 결과가 비어 있습니다.', 500, 'RUNNER_EMPTY_OUTPUT');
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new AppError('실행 엔진 결과 파싱에 실패했습니다.', 500, 'RUNNER_PARSE_ERROR');
  }
};

export const runIsolatedPython = async ({
  code,
  stdin = '',
  timeLimitSeconds,
  memoryLimitMB,
  pythonExecutable,
  tempDir,
} = {}) => {
  if (typeof code !== 'string') {
    throw new AppError('코드는 문자열이어야 합니다.', 400, 'INVALID_CODE');
  }

  const timeLimit = clampTimeout(timeLimitSeconds ?? config.judging.defaultTimeoutSeconds);
  const memLimit = memoryLimitMB ?? config.judging.maxMemoryMB ?? 256;
  const pythonExe = pythonExecutable || config.judging.pythonExecutable || 'python';
  const baseTempDir = tempDir || config.judging.tempDir || path.join(os.tmpdir(), 'judging-temp');

  const runDir = await ensureTempDir(baseTempDir);
  const codePath = path.join(runDir, 'main.py');
  await fs.promises.writeFile(codePath, code, 'utf8');

  const runnerScript = buildRunnerScript();

  return new Promise((resolve, reject) => {
    const child = spawn(pythonExe, ['-c', runnerScript, codePath, String(timeLimit), String(memLimit), runDir], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('error', async (err) => {
      await removeDirSafe(runDir);
      reject(new AppError(`실행 엔진이 시작되지 않았습니다: ${err.message}`, 500, 'RUNNER_START_FAILED'));
    });
    child.on('close', async () => {
      await removeDirSafe(runDir);
      try {
        const parsed = parseRunnerOutput(stdout.trim());
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
};

export default runIsolatedPython;
