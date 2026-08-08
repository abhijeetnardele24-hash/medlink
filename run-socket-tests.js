const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const apiPath = path.join(__dirname, 'services', 'api');

const envPath = path.join(apiPath, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const customEnv = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) customEnv[match[1]] = match[2];
});
const combinedEnv = { ...process.env, ...customEnv, TEST_BYPASS_AUTH: 'true', PORT: '3001' };

console.log("Starting API server in bypass mode...");
const api = spawn('npm', ['run', 'dev'], {
  cwd: apiPath,
  shell: true,
  env: combinedEnv
});

setTimeout(() => {
  console.log("API is ready. Running test script...");
  
  const test = spawn('npx.cmd', ['tsx', 'test-socket-auth.ts'], {
    cwd: apiPath,
    shell: true,
    env: combinedEnv
  });

  test.stdout.pipe(process.stdout);
  test.stderr.pipe(process.stderr);

  test.on('close', (code) => {
    console.log(`Test script finished with code ${code}`);
    api.kill();
    process.exit(code);
  });
}, 5000);

api.stderr.pipe(process.stderr);
