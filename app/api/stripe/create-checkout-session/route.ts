import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createOrRetrieveCustomer } from '@/lib/stripe/server';

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }
    
    // Get the user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's organization
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', session.user.id)
      .eq('role', 'owner')
      .single();
    
    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'No organization found or not an owner' },
        { status: 403 }
      );
    }

    // Get or create Stripe customer
    const customer = await createOrRetrieveCustomer(
      session.user.email!,
      orgMember.organization_id
    );

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      organizationId: orgMember.organization_id,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    });
    
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}