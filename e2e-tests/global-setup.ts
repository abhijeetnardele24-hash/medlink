import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  console.log('Running global setup (Seeding medicines)...');
  const apiPath = path.resolve(__dirname, '../services/api');
  try {
    execSync('npx tsx seed_medicines.ts', { cwd: apiPath, stdio: 'inherit' });
    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed failed', error);
  }
}
