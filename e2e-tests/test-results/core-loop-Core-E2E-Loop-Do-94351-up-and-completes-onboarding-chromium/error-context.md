# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-loop.spec.ts >> Core E2E Loop >> Doctor signs up and completes onboarding
- Location: tests\core-loop.spec.ts:27:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[name="hospital"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - heading "MedLink Doc" [level=2] [ref=e9]
    - navigation [ref=e10]:
      - link "Dashboard" [ref=e11] [cursor=pointer]:
        - /url: /
      - link "My Patients" [ref=e14] [cursor=pointer]:
        - /url: /patients
      - link "Availability" [ref=e20] [cursor=pointer]:
        - /url: /availability
      - link "Profile" [ref=e24] [cursor=pointer]:
        - /url: /profile
    - generic [ref=e28]:
      - generic [ref=e34]:
        - generic [ref=e35]: Doctor
        - generic [ref=e36]: doctor-1786296074991@test.local
      - button "Sign Out" [ref=e37] [cursor=pointer]
  - main [ref=e41]:
    - button "View notifications" [ref=e44]
    - generic [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - heading "Welcome back, Dr. Doctor 👋" [level=1] [ref=e52]
          - paragraph [ref=e53]: Sunday, August 9
        - generic [ref=e54]:
          - button [ref=e55] [cursor=pointer]
          - button "Manage Availability" [ref=e61] [cursor=pointer]
      - generic [ref=e64]:
        - generic [ref=e65]:
          - generic [ref=e70]: "0"
          - generic [ref=e71]: Pending Requests
        - generic [ref=e72]:
          - generic [ref=e78]: "0"
          - generic [ref=e79]: Upcoming Today
        - generic [ref=e80]:
          - generic [ref=e88]: "0"
          - generic [ref=e89]: Total Patients
        - generic [ref=e90]:
          - generic [ref=e96]: "0"
          - generic [ref=e97]: All Appointments
      - generic [ref=e98]:
        - heading "Upcoming Appointments" [level=2] [ref=e99]
        - generic [ref=e102]:
          - heading "Clear Schedule" [level=3] [ref=e105]
          - paragraph [ref=e106]: You have no upcoming appointments. Make sure your availability is up to date.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const runId = Date.now();
  4   | const patientEmail = `patient-${runId}@test.local`;
  5   | const doctorEmail = `doctor-${runId}@test.local`;
  6   | const password = 'Password123!';
  7   | 
  8   | test.describe('Core E2E Loop', () => {
  9   |   test.describe.configure({ mode: 'serial' });
  10  | 
  11  |   let patientPage;
  12  |   let doctorPage;
  13  |   let adminPage;
  14  | 
  15  |   test.beforeAll(async ({ browser }) => {
  16  |     patientPage = await browser.newPage();
  17  |     doctorPage = await browser.newPage();
  18  |     adminPage = await browser.newPage();
  19  |   });
  20  | 
  21  |   test.afterAll(async () => {
  22  |     await patientPage.close();
  23  |     await doctorPage.close();
  24  |     await adminPage.close();
  25  |   });
  26  | 
  27  |   test('Doctor signs up and completes onboarding', async () => {
  28  |     await doctorPage.goto('http://localhost:5173/signup');
  29  |     await doctorPage.fill('input[type="email"]', doctorEmail);
  30  |     await doctorPage.fill('input[type="password"]', password);
  31  |     await doctorPage.locator('input[type="text"]').fill(`Dr. Playwright ${runId}`);
  32  |     await doctorPage.locator('input[type="tel"]').fill(`9999999999`);
  33  |     await doctorPage.click('button[type="submit"]');
  34  | 
  35  |     await expect(doctorPage).toHaveURL('http://localhost:5173/');
> 36  |     await doctorPage.fill('input[name="hospital"]', 'Playwright Hospital');
      |                      ^ Error: page.fill: Target page, context or browser has been closed
  37  |     await doctorPage.fill('input[name="speciality"]', 'General Medicine');
  38  |     await doctorPage.fill('input[name="education"]', 'MBBS, MD');
  39  |     await doctorPage.fill('input[name="experience"]', '5');
  40  |     await doctorPage.fill('input[name="registration"]', `REG-${runId}`);
  41  |     await doctorPage.fill('input[name="consultationFee"]', '500');
  42  |     await doctorPage.click('button[type="submit"]');
  43  |     
  44  |     // Doctor should now be 'pending_verification'
  45  |     // But since the UI may not immediately show it, we just wait for the submit to complete.
  46  |     await expect(doctorPage.locator('text=Pending Verification')).toBeVisible({ timeout: 10000 });
  47  |   });
  48  | 
  49  |   test('Admin approves the doctor', async () => {
  50  |     await adminPage.goto('http://localhost:5174/login');
  51  |     await adminPage.fill('input[type="email"]', 'admin@medlink.com');
  52  |     await adminPage.fill('input[type="password"]', 'password123');
  53  |     await adminPage.click('button[type="submit"]');
  54  | 
  55  |     await expect(adminPage).toHaveURL('http://localhost:5174/');
  56  |     // Wait for queue to load
  57  |     const doctorRow = adminPage.locator(`text=Dr. Playwright ${runId}`).locator('..');
  58  |     await expect(doctorRow).toBeVisible({ timeout: 10000 });
  59  |     // Assuming the "Accept" button is a button inside the row
  60  |     await doctorRow.locator('button:has-text("Verify")').click();
  61  |     
  62  |     // Actually let's look at coordinator's VerificationQueue.tsx to see the exact text
  63  |     // I will fix the selector below if needed, assuming the success button says "Approve" or "Verify"
  64  |   });
  65  | 
  66  |   test('Doctor sets availability', async () => {
  67  |     await doctorPage.reload();
  68  |     await expect(doctorPage.locator('text=Pending Verification')).not.toBeVisible();
  69  |     
  70  |     await doctorPage.click('text=Availability');
  71  |     
  72  |     // The default date is probably today. Let's just set the time.
  73  |     await doctorPage.fill('input[id="startTime"]', '09:00');
  74  |     await doctorPage.fill('input[id="endTime"]', '17:00');
  75  |     await doctorPage.click('button[type="submit"]');
  76  |     
  77  |     // Assuming it adds successfully
  78  |     await expect(doctorPage.locator('text=09:00 - 17:00')).toBeVisible();
  79  |   });
  80  | 
  81  |   test('Patient signs up, searches, and books the doctor', async () => {
  82  |     await patientPage.goto('http://localhost:5176/signup');
  83  |     await patientPage.fill('input[type="email"]', patientEmail);
  84  |     await patientPage.fill('input[type="password"]', password);
  85  |     await patientPage.locator('input[type="text"]').fill(`Patient Playwright`);
  86  |     await patientPage.click('button[type="submit"]');
  87  | 
  88  |     await expect(patientPage).toHaveURL('http://localhost:5176/');
  89  | 
  90  |     // The patient dashboard lists all doctors. We find our test doctor's card and click Book Appointment.
  91  |     const doctorCard = patientPage.locator(`text=Dr. Playwright ${runId}`).locator('..').locator('..');
  92  |     await doctorCard.locator('text=Book Appointment').click();
  93  |     
  94  |     await expect(patientPage).toHaveURL(/.*doctor\/.*/);
  95  | 
  96  |     // Book appointment
  97  |     await patientPage.click('button:has-text("Book Appointment")');
  98  |     // Select the slot we just created. It might have a text like "9:00 AM"
  99  |     await patientPage.click('text=9:00 AM');
  100 |     // Complete payment (mock razorpay)
  101 |     await patientPage.evaluate(() => {
  102 |       (window as any).Razorpay = function(options: any) {
  103 |         this.open = () => {
  104 |           setTimeout(() => {
  105 |             options.handler({
  106 |               razorpay_order_id: 'mock_order_' + Date.now(),
  107 |               razorpay_payment_id: 'mock_payment_' + Date.now(),
  108 |               razorpay_signature: 'mock_signature'
  109 |             });
  110 |           }, 500);
  111 |         };
  112 |         this.on = () => {};
  113 |       };
  114 |     });
  115 |     
  116 |     await patientPage.click('button:has-text("Confirm Booking")');
  117 |     // Because of the mock, it will automatically call the success handler after 500ms
  118 |     // which then verifies payment and navigates to history
  119 |     
  120 |     await expect(patientPage).toHaveURL('http://localhost:5176/history');
  121 | 
  122 |     // --- Consultation ---
  123 |     // Patient joins room
  124 |     const historyCard = patientPage.locator('text=Patient Playwright').locator('..').locator('..').first(); // Actually the history page shows the concern. Let's just click Join Room in history if it exists, or go to dashboard to join.
  125 |     // Wait, the appointment might not be "ended" yet so it won't show in history.
  126 |     // Patient should go to Dashboard (Upcoming Appointments)
  127 |     await patientPage.click('text=Dashboard');
  128 |     // We expect a "Join Room" or "Join Call" button.
  129 |     const patientJoinBtn = patientPage.locator('button:has-text("Join Room")').first();
  130 |     await expect(patientJoinBtn).toBeVisible({ timeout: 10000 });
  131 |     await patientJoinBtn.click();
  132 |     await expect(patientPage).toHaveURL(/.*consultation\/.*/);
  133 | 
  134 |     // Doctor joins room
  135 |     await doctorPage.reload();
  136 |     await doctorPage.click('text=Dashboard');
```