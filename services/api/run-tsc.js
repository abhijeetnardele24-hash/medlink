const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', { cwd: __dirname, encoding: 'utf-8', shell: 'cmd.exe' });
  console.log('SUCCESS:\n', output);
} catch (err) {
  console.error('ERROR:\n', err.stdout);
}
