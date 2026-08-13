const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx tsc --noEmit', { cwd: __dirname, encoding: 'utf-8', shell: 'cmd.exe' });
  fs.writeFileSync('tsc-out.txt', 'SUCCESS\n' + out);
} catch(e) {
  fs.writeFileSync('tsc-out.txt', 'ERROR\n' + e.stdout + '\n' + e.stderr);
}
