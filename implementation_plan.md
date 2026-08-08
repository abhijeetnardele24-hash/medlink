# Section 2.3: Pharmacy Web & Catalog Implementation Plan

This document outlines the approach for building `apps/pharmacy-web`, the underlying medicines catalog, and the updated order/checkout flow.

## 1. Schema Additions

We will introduce two new tables to support a real medicine catalog and itemized orders, rather than the current flat rate mock.

### `medicines` Table
```typescript
export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  price: integer("price").notNull(), // Price in INR
  stockQuantity: integer("stock_quantity").notNull().default(0),
  requiresPrescription: boolean("requires_prescription").notNull().default(false),
  category: text("category"), // e.g., "Antibiotics", "Supplements"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### `pharmacy_order_items` Table
```typescript
export const pharmacyOrderItems = pgTable("pharmacy_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => pharmacyOrders.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // Snapshot of price at the time of purchase
});
```

> [!NOTE]
> We will also modify the existing `pharmacyOrders` table to default the status to `pending_payment` and ensure it can exist independently of a single `prescriptionId` (since users might buy non-prescription items like vitamins without a prescription). We will make `prescriptionId` nullable on the order, OR map the `prescriptionId` at the order-item level if an order mixes multiple prescriptions (simplest is making it nullable on the order level and validating it applies to all Rx items in the cart).

## 2. Resolving `medicinesJson` to Catalog Entries

Currently, doctors enter prescriptions in `medicinesJson` (often as free text or structured JSON without standard IDs). When a patient tries to check out a `requiresPrescription=true` medicine, we must verify they have a prescription for it.

**The Mapping Strategy:**
1. **At Checkout**: When the patient submits their cart and a `prescriptionId`, the backend pulls the `medicinesJson` for that prescription.
2. **Reconciliation**: For each prescription-only item in the cart, we run a text-matching algorithm. We normalize both strings (lowercase, strip whitespace/punctuation) and check if the cart item's `name` or `genericName` is a substring of *any* medicine name listed in the `medicinesJson` array.
3. **Future-proofing**: If we eventually update `doctor-web` to select from the catalog, `medicinesJson` can include a `medicineId` which makes this a direct O(1) match. For now, fuzzy text matching bridges the gap.
4. **Failure State**: If a cart item requires a prescription but no match is found in the provided prescription, the backend rejects the checkout request (403 Forbidden) indicating which medicine lacked authorization.

## 3. Backend Routes & Cart Handling

### Cart Handling
**Client-Side State**: The cart will be managed entirely on the client-side (React Context + `localStorage`) in `pharmacy-web`. A persistent DB cart is overkill for the MVP. Users build their cart locally and send it to the backend only at checkout.

### New / Updated Routes
- **`GET /medicines`**: Browse/search the catalog (supports `?search=` and `?category=` and `?requiresPrescription=`).
- **`GET /medicines/:id`**: Fetch details for a single medicine.
- **`POST /pharmacy/orders` (Replacing `POST /prescriptions/:id/order`)**:
  - **Body**: `{ items: [{ medicineId, quantity }], prescriptionId?: string, deliveryAddress: string }`
  - **Logic**: 
    1. Fetches prices for all `items` from the DB to calculate `totalAmount`.
    2. Validates stock quantity.
    3. If any item has `requiresPrescription === true`, validates that `prescriptionId` is provided, owned by the patient, and that the prescription's `medicinesJson` matches the requested item.
    4. Creates `pharmacy_orders` and `pharmacy_order_items`.
    5. Calls Razorpay to create a payment order and returns `razorpayOrderId`.
- **`POST /webhooks/razorpay`**: Update this existing webhook to also handle pharmacy payments, transitioning `pharmacyOrders.status` from `pending_payment` to `paid`.

## 4. `apps/pharmacy-web` Architecture & Pages

The app will follow the exact same architecture as the other apps:
- **Stack**: Vite + React + TypeScript + Tailwind CSS.
- **Auth**: Firebase Auth, `useAuth` hook, and Axios interceptors attaching the Bearer token.
- **Design**: Fully adheres to `.superdesign/design-system.md` (glassmorphism, primary blue palette, smooth micro-animations).

**Exact Page List:**
1. **`/` (Storefront Home)**: Search bar, featured categories, trending medicines.
2. **`/medicines` (Catalog/Search)**: Filterable list of all medicines.
3. **`/medicines/:id` (Product Detail)**: Medicine info, pricing, stock status, "Add to Cart" button.
4. **`/cart`**: Review items, adjust quantities. If Rx items exist, a UI to select one of their active prescriptions.
5. **`/checkout`**: Enter delivery address, summary, and "Pay with Razorpay" button.
6. **`/orders`**: Patient's order history and statuses.

## 5. Order Status Updates (Processing -> Delivered)

**In Scope for Coordinator Web.**
Once an order is `paid`, it needs to be fulfilled. Without a way to update the status, orders will be permanently stuck at `paid`. 
- **Plan**: I will add a simple "Pharmacy Orders" tab to `apps/coordinator-web` (or integrate it into the `PatientDetail` view). This will allow coordinators to see paid orders and update their status to `processing`, `shipped`, and `delivered`.

> [!WARNING]
> **Open Question:** Should `prescriptionId` on the `pharmacy_orders` table be made nullable? 
> Currently it is `notNull()`. If a patient buys only over-the-counter (OTC) medicines like vitamins, they won't have a prescription. Making it nullable is the correct approach for a mixed-cart e-commerce flow.

> [!WARNING]
> **Open Question:** Do you approve the substring matching strategy for reconciling `medicinesJson` to catalog items?

Please review and provide the go-ahead or any adjustments!
