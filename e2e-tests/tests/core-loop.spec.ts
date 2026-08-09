import { test, expect } from '@playwright/test';

const runId = Date.now();
const patientEmail = `patient-${runId}@test.local`;
const doctorEmail = `doctor-${runId}@test.local`;
const password = 'Password123!';

test.describe('Core E2E Loop', () => {
  test.describe.configure({ mode: 'serial' });

  let patientPage;
  let doctorPage;
  let adminPage;

  test.beforeAll(async ({ browser }) => {
    patientPage = await browser.newPage();
    doctorPage = await browser.newPage();
    adminPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await patientPage.close();
    await doctorPage.close();
    await adminPage.close();
  });

  test('Doctor signs up and completes onboarding', async () => {
    await doctorPage.goto('http://localhost:5173/signup');
    await doctorPage.fill('input[type="email"]', doctorEmail);
    await doctorPage.fill('input[type="password"]', password);
    await doctorPage.locator('input[type="text"]').fill(`Dr. Playwright ${runId}`);
    await doctorPage.locator('input[type="tel"]').fill(`9999999999`);
    await doctorPage.click('button[type="submit"]');

    await expect(doctorPage).toHaveURL('http://localhost:5173/');
    await doctorPage.fill('input[name="hospital"]', 'Playwright Hospital');
    await doctorPage.fill('input[name="speciality"]', 'General Medicine');
    await doctorPage.fill('input[name="education"]', 'MBBS, MD');
    await doctorPage.fill('input[name="experience"]', '5');
    await doctorPage.fill('input[name="registration"]', `REG-${runId}`);
    await doctorPage.fill('input[name="consultationFee"]', '500');
    await doctorPage.click('button[type="submit"]');
    
    // Doctor should now be 'pending_verification'
    // But since the UI may not immediately show it, we just wait for the submit to complete.
    await expect(doctorPage.locator('text=Pending Verification')).toBeVisible({ timeout: 10000 });
  });

  test('Admin approves the doctor', async () => {
    await adminPage.goto('http://localhost:5174/login');
    await adminPage.fill('input[type="email"]', 'admin@medlink.com');
    await adminPage.fill('input[type="password"]', 'password123');
    await adminPage.click('button[type="submit"]');

    await expect(adminPage).toHaveURL('http://localhost:5174/');
    // Wait for queue to load
    const doctorRow = adminPage.locator(`text=Dr. Playwright ${runId}`).locator('..');
    await expect(doctorRow).toBeVisible({ timeout: 10000 });
    // Assuming the "Accept" button is a button inside the row
    await doctorRow.locator('button:has-text("Verify")').click();
    
    // Actually let's look at coordinator's VerificationQueue.tsx to see the exact text
    // I will fix the selector below if needed, assuming the success button says "Approve" or "Verify"
  });

  test('Doctor sets availability', async () => {
    await doctorPage.reload();
    await expect(doctorPage.locator('text=Pending Verification')).not.toBeVisible();
    
    await doctorPage.click('text=Availability');
    
    // The default date is probably today. Let's just set the time.
    await doctorPage.fill('input[id="startTime"]', '09:00');
    await doctorPage.fill('input[id="endTime"]', '17:00');
    await doctorPage.click('button[type="submit"]');
    
    // Assuming it adds successfully
    await expect(doctorPage.locator('text=09:00 - 17:00')).toBeVisible();
  });

  test('Patient signs up, searches, and books the doctor', async () => {
    await patientPage.goto('http://localhost:5176/signup');
    await patientPage.fill('input[type="email"]', patientEmail);
    await patientPage.fill('input[type="password"]', password);
    await patientPage.locator('input[type="text"]').fill(`Patient Playwright`);
    await patientPage.click('button[type="submit"]');

    await expect(patientPage).toHaveURL('http://localhost:5176/');

    // The patient dashboard lists all doctors. We find our test doctor's card and click Book Appointment.
    const doctorCard = patientPage.locator(`text=Dr. Playwright ${runId}`).locator('..').locator('..');
    await doctorCard.locator('text=Book Appointment').click();
    
    await expect(patientPage).toHaveURL(/.*doctor\/.*/);

    // Book appointment
    await patientPage.click('button:has-text("Book Appointment")');
    // Select the slot we just created. It might have a text like "9:00 AM"
    await patientPage.click('text=9:00 AM');
    await patientPage.click('button:has-text("Confirm Booking")');

    // Complete payment (mock razorpay)
    await expect(patientPage.locator('text=Razorpay')).toBeVisible({ timeout: 10000 });
    await patientPage.click('button:has-text("Simulate Success")');
    
    await expect(patientPage).toHaveURL('http://localhost:5173/history');
  });
});
