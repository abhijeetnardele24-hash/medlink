const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  try {
    const tokenPath = path.join(os.homedir(), '.cloudflare_turn_token');
    const token = fs.readFileSync(tokenPath, 'utf8').trim();
    const accountId = '3ca7ef1608fd7df1956c230feb6268d9';
    
    // 1. Create a TURN key
    const createRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/calls/turn/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'MedLink-TURN-Key' })
    });
    
    const createData = await createRes.json();
    if (!createData.success) {
      console.error('Failed to create TURN key:', createData.errors);
      return;
    }
    
    const turnKeyId = createData.result.uid;
    console.log(`Successfully created TURN Key: ${turnKeyId}`);
    
    // 2. Update services/api/.env
    const envPath = path.join(__dirname, 'services', 'api', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(/CLOUDFLARE_ACCOUNT_ID=.*/, `CLOUDFLARE_ACCOUNT_ID=${accountId}`);
    envContent = envContent.replace(/CLOUDFLARE_TURN_KEY_ID=.*/, `CLOUDFLARE_TURN_KEY_ID=${turnKeyId}`);
    envContent = envContent.replace(/CLOUDFLARE_TURN_API_TOKEN=.*/, `CLOUDFLARE_TURN_API_TOKEN=${token}`);
    
    fs.writeFileSync(envPath, envContent);
    console.log('.env updated successfully.');
    
    // Also protect .env in gitignore
    const gitignorePath = path.join(__dirname, 'services', 'api', '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.env')) {
        fs.appendFileSync(gitignorePath, '\n.env\n');
        console.log('.env added to .gitignore');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
