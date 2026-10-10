require('dotenv').config({ path: 'services/api/.env' });
const { FIREBASE_API_KEY } = process.env;

(async () => {
  // Login to Firebase
  const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDqf5K_5jsz4VEILbcXQzSrabda39pIy-M`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor6@medlink.com', password: 'password123', returnSecureToken: true })
  });
  const loginData = await loginRes.json();
  const token = loginData.idToken;

  const res = await fetch('http://localhost:3000/webrtc/credentials', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
