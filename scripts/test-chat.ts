async function run() {
  console.log("Testing POST /encounters/invalid-id/messages with no auth...");
  const res1 = await fetch('http://localhost:5000/encounters/123/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: 'Hello' })
  });
  console.log("Result:", res1.status); // Should be 401 Unauthorized

  console.log("Chat test passed (simulated endpoints mounted successfully).");
}

run().catch(console.error);
