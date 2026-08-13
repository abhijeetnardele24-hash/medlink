const { execSync } = require('child_process');
console.log(execSync('npm i recharts', { encoding: 'utf-8', stdio: 'inherit' }));
