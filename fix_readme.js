const fs = require('fs');

let buf = fs.readFileSync('REMAINING_WORK.md');
let str = buf.toString('utf8');
let cutoff = str.indexOf("so it stays a reliable source of truth rather than going stale.");
if (cutoff !== -1) {
  str = str.substring(0, cutoff + "so it stays a reliable source of truth rather than going stale.".length);
}

const newSection = 

---

## 2.5 P1 — Pharmacist onboarding & enterprise pharmacy marketplace

**Target:** \pps/pharmacy-web\, \pps/patient-web\, \pps/coordinator-web\, \services/api\
**Status:** Planned.

### Open Questions Resolved
Before implementing the schema or the frontend, we established the following architectural decisions:

1. **Pharmacy-web vs Patient-web separation:** 
   - **Decision:** Separate. Patients will **not** log into \pharmacy-web\.
   - **Reasoning:** Patients already have \patient-web\ for managing appointments, consultations, and prescriptions. Forcing them to log into a separate app just to buy medicines fractures the user experience. \patient-web\ will host the storefront (browsing and buying). \pharmacy-web\ acts exclusively as the **Pharmacist Seller Portal** (for pharmacists to manage inventory, set pricing, and handle onboarding).
   
2. **Doctor-tagging mechanism:**
   - **Decision:** We use a many-to-many junction table (\doctor_medicine_recommendations\).
   - **Reasoning:** A simple \doctorRecommended\ boolean flag on the \medicines\ table provides no attribution—any doctor could toggle it, and we wouldn't know who or why. A junction table allows us to build trust signals like "Recommended by 5 doctors" or "Recommended by Dr. Smith (your doctor)", which directly serves the core premise of MedLink (doctor-patient trust). It also ensures that one doctor un-recommending a medicine doesn't globally revoke the recommendation if another doctor still stands by it.
   
3. **Coordinator approval for new listings:**
   - **Decision:** Yes, new listings require full coordinator approval.
   - **Reasoning:** While pharmacists are verified professionals, a central catalog must prevent duplicates, enforce consistent naming (generic vs brand), and verify pricing constraints. A lightweight coordinator review (hence \listingStatus: 'pending'\ on new items) ensures catalog integrity before a product is visible to patients.

### Backend / Schema
1. Add \pharmacist\ to \user_role\ enum.
2. Create \pharmacists\ and \pharmacist_verifications\ tables mirroring the doctor onboarding pattern.
3. Update \medicines\ with \pharmacist_id\ (nullable) and \listing_status\ (pending/approved/rejected).
4. Create \doctor_medicine_recommendations\ table to track which doctors recommend which medicines.

### Pharmacist Seller Portal (\pharmacy-web\)
1. Build full auth flow: Login, Signup, Onboarding (license upload, shop details).
2. Build Inventory Dashboard for verified pharmacists to add/edit medicines and manage stock/pricing.

### Coordinator Dashboard (\coordinator-web\)
1. Extend \VerificationQueue\ to include a tab for pending Pharmacist applications, using the same approve/reject pattern.

### Doctor App (\doctor-web\)
1. Add UI for doctors to tag/recommend specific medicines within their specialty.

### Patient Storefront (\patient-web\)
1. Polish the medicine catalog with category filtering, search-as-you-type, and a multi-seller storefront view (if multiple pharmacists sell the same generic product).
*(Note: Real-time inventory locking at checkout and courier logistics are out of scope for this pass).*
;

fs.writeFileSync('REMAINING_WORK.md', str + newSection);
