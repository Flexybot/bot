import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import Stripe from 'stripe';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create admin client for webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata.organization_id;

        if (!organizationId) {
          throw new Error('No organization ID in subscription metadata');
        }

        // Get price id to determine plan
        const priceId = subscription.items.data[0].price.id;
        
        // Map price ID to plan ID
        let planId: string;
        switch (priceId) {
          case process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_MONTHLY:
          case process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_YEARLY:
            planId = 'basic';
            break;
          case process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_MONTHLY:
          case process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_YEARLY:
            planId = 'premium';
            break;
          default:
            planId = 'free';
        }

        // Update subscription in database
        await supabase
          .from('subscriptions')
          .upsert({
            organization_id: organizationId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            plan_id: planId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata.organization_id;

        if (!organizationId) {
          throw new Error('No organization ID in subscription metadata');
        }

        // Update subscription to free plan and mark as canceled
        await supabase
          .from('subscriptions')
          .update({
            plan_id: 'free',
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription as string;
        
        if (!subscription) break;

        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription)
          .single();

        if (!subscriptionData) break;

        // Create invoice record
        await supabase
          .from('invoices')
          .insert({
            organization_id: subscriptionData.organization_id,
            stripe_invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
            created_at: new Date(invoice.created * 1000).toISOString(),
          });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription as string;
        
        if (!subscription) break;

        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription)
          .single();

        if (!subscriptionData) break;

        // Update subscription status to past_due
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', subscriptionData.organization_id);

        // TODO: Send notification email to organization owner
        
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}