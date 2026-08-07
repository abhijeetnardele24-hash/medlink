const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'apps', 'coordinator-web', 'src', 'pages', 'Dashboard.tsx');
if (fs.existsSync(target)) {
  fs.unlinkSync(target);
  console.log('Deleted orphaned Dashboard.tsx');
} else {
  console.log('File does not exist, nothing to do.');
}
