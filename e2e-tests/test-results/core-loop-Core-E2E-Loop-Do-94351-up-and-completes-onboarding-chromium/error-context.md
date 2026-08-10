# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-loop.spec.ts >> Core E2E Loop >> Doctor signs up and completes onboarding
- Location: tests\core-loop.spec.ts:27:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/signup
Call log:
  - navigating to "http://localhost:5173/signup", waiting until "load"

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
> 28  |     await doctorPage.goto('http://localhost:5173/signup');
      |                      ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/signup
  29  |     await doctorPage.fill('input[type="email"]', doctorEmail);
  30  |     await doctorPage.fill('input[type="password"]', password);
  31  |     await doctorPage.locator('input[type="text"]').fill(`Dr. Playwright ${runId}`);
  32  |     await doctorPage.locator('input[type="tel"]').fill(`9999999999`);
  33  |     await doctorPage.click('button[type="submit"]');
  34  | 
  35  |     await expect(doctorPage).toHaveURL('http://localhost:5173/onboarding');
  36  |     await doctorPage.fill('input[name="hospital"]', 'Playwright Hospital');
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
  57  |     const doctorCard = adminPage.locator(`.glass-panel:has-text("Dr. Playwright ${runId}")`);
  58  |     await expect(doctorCard).toBeVisible({ timeout: 10000 });
  59  |     // The success button says "Authorize"
  60  |     await doctorCard.locator('button:has-text("Authorize")').click();
  61  |     
  62  |     // Wait for it to disappear from the queue
  63  |     await expect(doctorCard).not.toBeVisible();
  64  |   });
  65  | 
  66  |   test('Doctor sets availability', async () => {
  67  |     await doctorPage.reload();
  68  |     await expect(doctorPage.locator('text=Pending Verification')).not.toBeVisible();
  69  |     
  70  |     await doctorPage.click('text=Availability');
  71  |     
  72  |     // Set a date (e.g. tomorrow)
  73  |     const tomorrow = new Date();
  74  |     tomorrow.setDate(tomorrow.getDate() + 1);
  75  |     const dateStr = tomorrow.toISOString().split('T')[0];
  76  |     
  77  |     await doctorPage.fill('input[id="date"]', dateStr);
  78  |     await doctorPage.fill('input[id="startTime"]', '09:00');
  79  |     await doctorPage.fill('input[id="endTime"]', '17:00');
  80  |     await doctorPage.click('button[type="submit"]');
  81  |     
  82  |     // Assuming it adds successfully
  83  |     await expect(doctorPage.locator(`text=from 09:00 to 17:00`)).toBeVisible();
  84  |   });
  85  | 
  86  |   test('Patient signs up, searches, and books the doctor', async () => {
  87  |     await patientPage.goto('http://localhost:5176/signup');
  88  |     await patientPage.fill('input[type="email"]', patientEmail);
  89  |     await patientPage.fill('input[type="password"]', password);
  90  |     await patientPage.locator('input[type="text"]').fill(`Patient Playwright`);
  91  |     await patientPage.locator('input[type="tel"]').fill('9999999999');
  92  |     await patientPage.click('button[type="submit"]');
  93  | 
  94  |     await expect(patientPage).toHaveURL('http://localhost:5176/');
  95  | 
  96  |     // The patient dashboard lists all doctors. We find our test doctor's card and click Book Appointment.
  97  |     const doctorCard = patientPage.locator(`.glass-panel:has-text("Dr. Playwright ${runId}")`).first();
  98  |     await doctorCard.locator('a:has-text("Book Appointment")').click();
  99  |     
  100 |     await expect(patientPage).toHaveURL(/.*doctor\/.*/);
  101 |     // Select the slot we just created. It could be formatted differently depending on locale,
  102 |     // so we'll just select the first available slot in the grid.
  103 |     await patientPage.locator('label:has-text("Available Time Slots")').locator('..').locator('div > div').first().click();
  104 |     
  105 |     // Complete payment (mock razorpay) - use route intercept to mock the script
  106 |     await patientPage.route('https://checkout.razorpay.com/v1/checkout.js', route => {
  107 |       route.fulfill({
  108 |         status: 200,
  109 |         contentType: 'application/javascript',
  110 |         body: `
  111 |           window.Razorpay = function(options) {
  112 |             this.open = () => {
  113 |               setTimeout(() => {
  114 |                 options.handler({
  115 |                   razorpay_order_id: 'mock_order_' + Date.now(),
  116 |                   razorpay_payment_id: 'mock_payment_' + Date.now(),
  117 |                   razorpay_signature: 'mock_signature'
  118 |                 });
  119 |               }, 500);
  120 |             };
  121 |             this.on = () => {};
  122 |           };
  123 |         `
  124 |       });
  125 |     });
  126 |     
  127 |     // Confirm booking (which loads Razorpay script)
  128 |     await patientPage.click('button:has-text("Confirm Booking")');
```