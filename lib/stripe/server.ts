import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function createOrRetrieveCustomer(email: string, organizationId: string) {
  try {
    // First, try to find an existing customer
    const { data: customers } = await stripe.customers.search({
      query: `email:'${email}' AND metadata['organization_id']:'${organizationId}'`,
    });

    if (customers && customers.length > 0) {
      return customers[0];
    }

    // If no customer exists, create a new one
    const customer = await stripe.customers.create({
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
    const session = await stripe.checkout.sessions.create({
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
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error;
  }
}