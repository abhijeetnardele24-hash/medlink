import fs from 'fs';
import path from 'path';

const routesPath = path.join(__dirname, 'src', 'routes', 'pharmacy.routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// The replacement logic to add Razorpay creation inside /orders/:orderId/build
const findString = `    // Razorpay 
    let rzpOrderId = null;
    let rzpAmount = totalAmount * 100;
    // We assume Razorpay is initialized globally in this file as \\\`razorpay\\\`
    if ((global as any).razorpay || 1) { // Will just use the outer scope razorpay instance
      // hack for razorpay access inside script string eval: the variable is in the outer scope
    }
    // Let's just update the order and add items
    await getDb().transaction(async (tx) => {
      await tx.insert(pharmacyOrderItems).values(orderItemsToInsert);
      await tx.update(pharmacyOrders).set({ totalAmount, status: "pending_payment" }).where(eq(pharmacyOrders.id, orderId));
    });`;

const replaceString = `    // Razorpay
    let rzpOrderId = null;
    if (razorpay) {
      const rzpOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // in paise
        currency: "INR",
        receipt: \`pharmacy_order_\${orderId}\`
      });
      rzpOrderId = rzpOrder.id;
    }
    
    await getDb().transaction(async (tx) => {
      await tx.insert(pharmacyOrderItems).values(orderItemsToInsert);
      await tx.update(pharmacyOrders).set({ totalAmount, status: "pending_payment", razorpayOrderId: rzpOrderId }).where(eq(pharmacyOrders.id, orderId));
    });`;

content = content.replace(findString, replaceString);
fs.writeFileSync(routesPath, content);
console.log('Build route patched successfully');
