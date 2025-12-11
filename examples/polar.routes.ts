import { devPublicProcedure } from "@/features/dev/procedures";
import { polarMiddleware } from "@/lib/orpc";

// Test IDs for routes that require organization/product/customer context
const TEST_ORGANIZATION_ID = "org_test"; // Replace with actual organization ID
const TEST_PRODUCT_ID = "prod_test"; // Replace with actual product ID
const TEST_CUSTOMER_ID = "cus_test123"; // Replace with actual customer ID

// ========================================================================
// CUSTOMER OPERATIONS
// ========================================================================

export const polarCustomerOperations = devPublicProcedure
  .use(polarMiddleware)
  .handler(async ({ context }) => {
    const email = "customer@example.com";

    // PERSIST: Create customer with full details
    const customer = await context.polarClient.customers.create({
      email,
      name: "Premium Customer",
      organizationId: TEST_ORGANIZATION_ID,
      externalId: `dev-route-${Date.now()}`,
      metadata: {
        tier: "premium",
        signup_source: "dev-route",
        created_at: new Date().toISOString(),
      },
      billingAddress: {
        country: "US",
        line1: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94111",
      },
    });

    // FETCH: Retrieve customer
    await context.polarClient.customers.get({
      id: customer.id,
    });

    // PERSIST: Update customer
    await context.polarClient.customers.update({
      id: customer.id,
      customerUpdate: {
        metadata: {
          updated_at: new Date().toISOString(),
        },
      },
    });

    // FETCH: List customers with auto-pagination
    await context.polarClient.customers.list({
      organizationId: TEST_ORGANIZATION_ID,
      limit: 3,
    });

    // FETCH: Get customer state (subscriptions, orders, benefits)
    await context.polarClient.customers.getState({
      id: customer.id,
    });

    // FETCH: Get customer balance
    await context.polarClient.customers.getBalance({
      id: customer.id,
    });

    // FETCH: Export customers
    await context.polarClient.customers.export({
      organizationId: TEST_ORGANIZATION_ID,
    });

    // PERSIST: Delete customer
    await context.polarClient.customers.delete({
      id: customer.id,
    });

    return { success: true };
  });

// ========================================================================
// CHECKOUT OPERATIONS
// ========================================================================

export const polarCheckoutOperations = devPublicProcedure
  .use(polarMiddleware)
  .handler(async ({ context }) => {
    // PERSIST: Create checkout session
    const checkout = await context.polarClient.checkouts.create({
      products: [TEST_PRODUCT_ID],
      successUrl: "https://example.com/success",
      customerEmail: "customer@example.com",
      customerName: "Test Customer",
      customerBillingAddress: {
        country: "US",
        line1: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94111",
      },
      metadata: {
        order_id: `order-${Date.now()}`,
        customer_id: TEST_CUSTOMER_ID,
      },
    });

    // FETCH: Retrieve checkout session
    await context.polarClient.checkouts.get({
      id: checkout.id,
    });

    // PERSIST: Update checkout session
    await context.polarClient.checkouts.update({
      id: checkout.id,
      checkoutUpdate: {
        customerEmail: "updated@example.com",
        metadata: {
          updated: "true",
        },
      },
    });

    return { success: true };
  });

// ========================================================================
// ORDER OPERATIONS
// ========================================================================

export const polarOrderOperations = devPublicProcedure
  .use(polarMiddleware)
  .handler(async ({ context }) => {
    // FETCH: List orders for organization
    await context.polarClient.orders.list({
      organizationId: TEST_ORGANIZATION_ID,
      limit: 10,
    });

    return { success: true };
  });

// ========================================================================
// CUSTOMER PORTAL OPERATIONS
// ========================================================================

export const polarCustomerPortalOperations = devPublicProcedure
  .use(polarMiddleware)
  .handler(async ({ context }) => {
    // PERSIST: Create customer portal session
    const customerSession = await context.polarClient.customerSessions.create({
      customerId: TEST_CUSTOMER_ID,
    });

    // FETCH: Get customer via portal (using customer session token)
    await context.polarClient.customerPortal.customers.get(
      { customerSession: customerSession.token },
      {},
    );

    // FETCH: List subscriptions via portal
    await context.polarClient.customerPortal.subscriptions.list(
      { customerSession: customerSession.token },
      { limit: 10 },
    );

    // FETCH: List orders via portal
    await context.polarClient.customerPortal.orders.list(
      { customerSession: customerSession.token },
      { limit: 10 },
    );

    return { success: true };
  });

// ========================================================================
// PAYMENT METHOD OPERATIONS
// ========================================================================

export const polarPaymentMethodOperations = devPublicProcedure
  .use(polarMiddleware)
  .handler(async ({ context }) => {
    // PERSIST: Create customer portal session for payment method operations
    const customerSession = await context.polarClient.customerSessions.create({
      customerId: TEST_CUSTOMER_ID,
    });

    // FETCH: List payment methods (requires Stripe integration)
    await context.polarClient.customerPortal.customers.listPaymentMethods(
      { customerSession: customerSession.token },
      { limit: 10 },
    );

    // PERSIST: Add payment method (requires Stripe confirmation token)
    // Note: This would typically be called after collecting payment details via Stripe.js
    const paymentMethodId = "pm_test123"; // Replace with actual Stripe confirmation token ID
    if (paymentMethodId !== "pm_test123") {
      await context.polarClient.customerPortal.customers.addPaymentMethod(
        { customerSession: customerSession.token },
        {
          confirmationTokenId: paymentMethodId,
          setDefault: true,
          returnUrl: "https://example.com/payment-methods",
        },
      );
    }

    // PERSIST: Confirm payment method (requires Stripe setup intent)
    // Note: This would typically be called after Stripe payment method setup flow
    const setupIntentId = "seti_test123"; // Replace with actual Stripe setup intent ID
    if (setupIntentId !== "seti_test123") {
      await context.polarClient.customerPortal.customers.confirmPaymentMethod(
        { customerSession: customerSession.token },
        {
          setupIntentId,
          setDefault: true,
        },
      );
    }

    // PERSIST: Delete payment method
    // Note: Cannot delete if payment method is used by active subscription
    const paymentMethodToDelete = "pm_existing123"; // Replace with actual payment method ID
    if (paymentMethodToDelete !== "pm_existing123") {
      await context.polarClient.customerPortal.customers.deletePaymentMethod(
        { customerSession: customerSession.token },
        { id: paymentMethodToDelete },
      );
    }

    return { success: true };
  });

// ========================================================================
// INVOICE OPERATIONS
// ========================================================================

export const polarInvoiceOperations = devPublicProcedure
  .use(polarMiddleware)
  .handler(async ({ context }) => {
    const orderId = "order_test123"; // Replace with actual order ID

    // PERSIST: Update order billing details (required before generating invoice)
    if (orderId !== "order_test123") {
      await context.polarClient.orders.update({
        id: orderId,
        orderUpdate: {
          billingName: "Test Customer",
          billingAddress: {
            country: "US",
            line1: "123 Main Street",
            city: "San Francisco",
            state: "CA",
            postalCode: "94111",
          },
        },
      });

      // PERSIST: Generate invoice for order (requires paid order with billing details)
      await context.polarClient.orders.generateInvoice({
        id: orderId,
      });

      // FETCH: Get order invoice
      await context.polarClient.orders.invoice({
        id: orderId,
      });
    }

    // FETCH: List orders for organization (orders contain invoice info)
    await context.polarClient.orders.list({
      organizationId: TEST_ORGANIZATION_ID,
      limit: 10,
    });

    return { success: true };
  });

// ========================================================================
// POLAR ROUTER EXPORT
// ========================================================================

export const polarRouter = {
  polarCustomerOperations,
  polarCheckoutOperations,
  polarOrderOperations,
  polarCustomerPortalOperations,
  polarPaymentMethodOperations,
  polarInvoiceOperations,
} as const;

export type PolarRouter = typeof polarRouter;
