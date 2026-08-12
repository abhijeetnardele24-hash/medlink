import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDqf5K_5jsz4VEILbcXQzSrabda39pIy-M",
  authDomain: "medlink-f0762.firebaseapp.com",
  projectId: "medlink-f0762",
  storageBucket: "medlink-f0762.firebasestorage.app",
  messagingSenderId: "749505680778",
  appId: "1:749505680778:web:581e5221e6b56d55d1a473"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
    console.log(`Creating testpatient@medlink.com...`);
    await createUserWithEmailAndPassword(auth, 'testpatient@medlink.com', 'Password123!');
    console.log(`Successfully created testpatient@medlink.com`);
  } catch (err: any) {
    console.error(`Error creating testpatient@medlink.com:`, err.message);
  }
  process.exit(0);
}

run();
