import { Stripe, loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Plan IDs - these should match your Stripe product price IDs
export const STRIPE_PLANS = {
  BASIC: {
    MONTHLY: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_MONTHLY,
    YEARLY: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_YEARLY,
  },
  PREMIUM: {
    MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_MONTHLY,
    YEARLY: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_YEARLY,
  },
} as const;

// Feature limits for each plan
export const PLAN_LIMITS = {
  FREE: {
    chatbots: 1,
    teamMembers: 1,
    documents: 5,
    storage: 50, // MB
    messagesPerMonth: 100,
  },
  BASIC: {
    chatbots: 3,
    teamMembers: 3,
    documents: 20,
    storage: 200, // MB
    messagesPerMonth: 1000,
  },
  PREMIUM: {
    chatbots: 10,
    teamMembers: 10,
    documents: 100,
    storage: 1024, // MB
    messagesPerMonth: 5000,
  },
} as const;