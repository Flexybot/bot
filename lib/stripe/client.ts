import { getStripe } from './config';

export async function createCheckoutSession(priceId: string, customerId?: string) {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Redirect to Stripe Checkout
    const stripe = await getStripe();
    if (!stripe) throw new Error('Failed to load Stripe');

    const { error: stripeError } = await stripe.redirectToCheckout({ 
      sessionId: data.sessionId 
    });
    
    if (stripeError) throw stripeError;

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

export async function createPortalSession(customerId: string) {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Redirect to Stripe Customer Portal
    window.location.href = data.url;

  } catch (error: any) {
    console.error('Error creating portal session:', error);
    throw new Error(error.message || 'Failed to create portal session');
  }
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateYearlyPrice(monthlyPrice: number): number {
  return Math.floor(monthlyPrice * 12 * 0.85); // 15% discount for yearly
}