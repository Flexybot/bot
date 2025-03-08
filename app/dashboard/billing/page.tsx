"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganization } from '@/hooks/useOrganization';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/client';
import { toast } from 'sonner';
import { 
  CheckIcon, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  BarChart4, 
  FileText,
  ArrowRight,
  Download,
  Lock
} from 'lucide-react';

// Plan configuration
const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'For personal and small projects',
    price: 0,
    priceId: 'price_free',
    features: [
      '1 chatbot',
      '1 team member',
      'Up to 5 documents',
      '50MB storage',
      'Basic analytics',
      'Community support'
    ],
    limits: {
      chatbots: 1,
      teamMembers: 1,
      documents: 5,
      storage: 50, // MB
      messagesPerMonth: 100
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For small businesses and startups',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    features: [
      'Up to 3 chatbots',
      'Up to 3 team members',
      'Up to 20 documents',
      '200MB storage',
      'Advanced analytics',
      'Email support',
      'Custom domain',
      'API access'
    ],
    limits: {
      chatbots: 3,
      teamMembers: 3,
      documents: 20,
      storage: 200, // MB
      messagesPerMonth: 1000
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For growing businesses and teams',
    price: 79,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Up to 10 chatbots',
      'Up to 10 team members',
      'Up to 100 documents',
      '1GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom domain',
      'API access',
      'Custom branding',
      'Advanced RAG configuration'
    ],
    limits: {
      chatbots: 10,
      teamMembers: 10,
      documents: 100,
      storage: 1024, // MB
      messagesPerMonth: 5000
    }
  }
];

export default function BillingPage() {
  const { subscription, currentOrganization } = useOrganization();
  const { usage, limits, getUsagePercentage } = useUsageLimit();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current plan
  const currentPlan = plans.find(p => p.id === subscription?.plan?.id) || plans[0];
  const isFreePlan = currentPlan.id === 'free';
  
  // Format renewal date
  const renewalDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end)
    : new Date();
  
  const formattedRenewalDate = renewalDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Handle plan change
  const handlePlanChange = async (planId: string) => {
    try {
      setIsLoading(true);
      const plan = plans.find(p => p.id === planId);
      
      if (!plan?.priceId) {
        throw new Error('Invalid plan selected');
      }

      // Get the correct price ID based on billing interval
      const priceId = billingInterval === 'yearly' 
        ? plan.price.yearly 
        : plan.price.monthly;
      
      await createCheckoutSession(priceId);
      
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Failed to change plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle portal session
  const handlePortalSession = async () => {
    try {
      setIsLoading(true);
      if (!subscription?.stripe_customer_id) {
        throw new Error('No customer ID found');
      }
      
      await createPortalSession(subscription.stripe_customer_id);
    } catch (error: any) {
      console.error('Error opening portal:', error);
      toast.error(error.message || 'Failed to open billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subscription & Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription, payment method, and billing history
        </p>
      </div>
      
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        
        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          {/* Current Plan Info */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your organization is currently on the {currentPlan.name} plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-xl">{currentPlan.name}</p>
                  <p className="text-muted-foreground">{currentPlan.description}</p>
                </div>
                <Badge variant={isFreePlan ? 'outline' : 'default'}>
                  {isFreePlan ? 'Free' : `$${currentPlan.price}/month`}
                </Badge>
              </div>
              
              {!isFreePlan && (
                <div className="text-sm text-muted-foreground">
                  Your plan renews on {formattedRenewalDate}
                </div>
              )}
            </CardContent>
            {!isFreePlan && (
              <CardFooter className="flex justify-between border-t p-4">
                <Button 
                  variant="outline" 
                  onClick={() => handlePortalSession()}
                  disabled={isLoading}
                >
                  Manage Subscription
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => handlePortalSession()}
                  disabled={isLoading}
                >
                  Update Payment Method
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Available Plans */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Available Plans</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={billingInterval === 'monthly' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setBillingInterval('monthly')}
                >
                  Monthly
                </Button>
                <Button 
                  variant={billingInterval === 'yearly' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setBillingInterval('yearly')}
                >
                  Yearly (Save 15%)
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan.id;
                const priceDisplay = plan.price === 0 
                  ? 'Free'
                  : billingInterval === 'monthly'
                    ? `$${plan.price}/month`
                    : `$${Math.round(plan.price * 10.2)}/year`;
                
                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col ${isCurrentPlan ? 'border-primary' : ''}`}
                  >
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <p className="text-3xl font-bold mt-2">
                        {priceDisplay}
                        {billingInterval === 'yearly' && plan.price > 0 && (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            (Save 15%)
                          </span>
                        )}
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckIcon className="mr-2 h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isCurrentPlan ? (
                        <Button className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          variant={plan.id === 'free' ? 'outline' : 'default'}
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={isLoading}
                        >
                          {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Usage</CardTitle>
              <CardDescription>
                Track your usage against plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Chatbots</span>
                    <span>{usage.chatbots} / {limits.chatbots}</span>
                  </div>
                  <Progress value={getUsagePercentage('chatbots')} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Team Members</span>
                    <span>{usage.teamMembers} / {limits.teamMembers}</span>
                  </div>
                  <Progress value={getUsagePercentage('teamMembers')} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Documents</span>
                    <span>{usage.documents} / {limits.documents}</span>
                  </div>
                  <Progress value={getUsagePercentage('documents')} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Storage</span>
                    <span>{usage.storage}MB / {limits.storage}MB</span>
                  </div>
                  <Progress value={getUsagePercentage('storage')} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Messages This Month</span>
                    <span>{usage.messages} / {limits.messages}</span>
                  </div>
                  <Progress value={getUsagePercentage('messages')} />
                </div>
              </div>
              
              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <BarChart4 className="h-4 w-4 mr-2" />
                  <span>Usage resets on {formattedRenewalDate}</span>
                </div>
                
                {getUsagePercentage('messages') > 80 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePlanChange('premium')}
                    disabled={isLoading}
                  >
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Detailed usage statistics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-center">
                <BarChart4 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Detailed analytics coming soon</h3>
                <p className="text-muted-foreground max-w-md">
                  We&apos;re working on more detailed usage analytics. Check back soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Method Tab */}
        <TabsContent value="payment" className="space-y-6">
          {isFreePlan ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  You don&apos;t have a payment method set up
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No payment method</AlertTitle>
                  <AlertDescription>
                    You&apos;re on the Free plan. Add a payment method when you&apos;re ready to upgrade.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => handlePlanChange('basic')}
                  disabled={isLoading}
                >
                  Upgrade to Paid Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Manage your payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• {subscription?.card_last4 || '4242'}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires {subscription?.card_exp_month || '12'}/{subscription?.card_exp_year || '2024'}
                      </p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline"
                    onClick={() => handlePortalSession()}
                    disabled={isLoading}
                  >
                    Update Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFreePlan ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                    You&apos;re on the Free plan. Invoices will appear here once you upgrade.
                  </p>
                  <Button 
                    onClick={() => handlePlanChange('basic')}
                    disabled={isLoading}
                  >
                    Upgrade to Paid Plan
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access your invoices</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                    View and download your invoices from the Stripe billing portal.
                  </p>
                  <Button 
                    onClick={() => handlePortalSession()}
                    disabled={isLoading}
                  >
                    View Billing Portal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}