const fs = require('fs');
let str = fs.readFileSync('REMAINING_WORK.md', 'utf8');

const newSection = `

### Porting Strategy & Clean Up (Added post-review)
1. **Porting, not rewriting:** The existing PharmacyCatalog and checkout logic currently in \`apps/pharmacy-web/src/App.tsx\` will be explicitly ported to \`apps/patient-web\`. This logic is already tested and handles Rx-gating, so it will be reused instead of rebuilt from scratch.
2. **Clean up old location:** Once ported, \`pharmacy-web/src/App.tsx\` will have the storefront code fully removed to avoid two competing implementations.
3. **Restructure \`pharmacy-web\`:** \`pharmacy-web\` will be split into proper page files under \`src/pages/\` (Login.tsx, Signup.tsx, Onboarding.tsx, InventoryDashboard.tsx) to match the conventions of the rest of the codebase, moving away from the single monolithic App.tsx.

### Execution Order
1. Schema and DB Migrations (Done)
2. Pharmacist-web Auth and Onboarding (Restructure and create Seller Portal)
3. Patient-web Storefront Port (Move catalog/checkout logic from old pharmacy-web)
4. Coordinator-web VerificationQueue Extension
5. Doctor-web Tagging UI
`;

fs.writeFileSync('REMAINING_WORK.md', str + newSection);
