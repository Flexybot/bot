import Stripe from 'stripe';

// Only throw during actual runtime, not build time
const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe API key not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
};

// Initialize stripe client lazily
let stripeClient: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    if (!stripeClient) {
      stripeClient = getStripeClient();
    }
    return stripeClient[prop as keyof Stripe];
  },
});

export async function createOrRetrieveCustomer(email: string, organizationId: string) {
  try {
    if (!stripeClient) {
      stripeClient = getStripeClient();
    }

    // First, try to find an existing customer
    const { data: customers } = await stripeClient.customers.search({
      query: `email:'${email}' AND metadata['organization_id']:'${organizationId}'`,
    });

    if (customers && customers.length > 0) {
      return customers[0];
    }

    // If no customer exists, create a new one
    const customer = await stripeClient.customers.create({
      email,
      metadata: {
        organization_id: organizationId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error in createOrRetrieveCustomer:', error);
    throw error;
  }
}

export async function createCheckoutSession({
  customerId,
  priceId,
  organizationId,
  mode = 'subscription',
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  organizationId: string;
  mode?: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    if (!stripeClient) {
      stripeClient = getStripeClient();
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organization_id: organizationId,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  try {
    if (!stripeClient) {
      stripeClient = getStripeClient();
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error;
  }
}