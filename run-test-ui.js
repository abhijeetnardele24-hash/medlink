const { chromium } = require('playwright');

(async () => {
  console.log("Launching Test Browser...");
  
  // Launch a visible browser with fake camera and microphone feeds
  // This bypasses the "Allow Camera" popup and injects a fake video feed automatically!
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1600,900'
    ]
  });

  // Create two completely isolated browser sessions (so logins don't mix)
  const docContext = await browser.newContext({ viewport: { width: 800, height: 900 }});
  const patContext = await browser.newContext({ viewport: { width: 800, height: 900 }});

  const docPage = await docContext.newPage();
  const patPage = await patContext.newPage();

  console.log("Opening Doctor Web and Patient Web...");
  
  // Open the local dev servers
  await docPage.goto('http://localhost:5173/login');
  await patPage.goto('http://localhost:5176/login');

  console.log("=========================================");
  console.log("✅ Test Browser is Ready!");
  console.log("=========================================");
  console.log("1. Log in to your Doctor account on the left.");
  console.log("2. Log in to your Patient account on the right.");
  console.log("3. Have the Doctor go to a Consultation page.");
  console.log("4. Leave the Patient on their Dashboard.");
  console.log("5. Click 'Start Call (Ring Patient)' as the Doctor.");
  console.log("6. Watch the Patient get the real-time ring and answer it!");
  console.log("=========================================");
  console.log("Press Ctrl+C in this terminal to close the test browser when done.");

  // Keep the script running forever so you can play with the UI
  await new Promise(() => {});
})();
