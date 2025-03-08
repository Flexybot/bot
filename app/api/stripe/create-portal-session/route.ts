import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe/server';

export async function POST(req: NextRequest) {
  try {
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
    
    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', orgMember.organization_id)
      .single();
    
    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    // Create portal session
    const portalSession = await createBillingPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}