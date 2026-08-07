const { execSync } = require('child_process');

try {
  console.log('Building doctor-web...');
  execSync('npm run build', { cwd: 'apps/doctor-web', stdio: 'inherit', shell: 'cmd.exe' });
  console.log('doctor-web build SUCCESS');
} catch (e) {
  console.error('doctor-web build FAILED');
}

try {
  console.log('Building coordinator-web...');
  execSync('npm run build', { cwd: 'apps/coordinator-web', stdio: 'inherit', shell: 'cmd.exe' });
  console.log('coordinator-web build SUCCESS');
} catch (e) {
  console.error('coordinator-web build FAILED');
}
