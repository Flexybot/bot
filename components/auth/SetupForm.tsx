"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export default function SetupForm() {
  const router = useRouter();
  const { createOrganization } = useOrganization();
  
  const [step, setStep] = useState(1);
  const [organizationName, setOrganizationName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      setError('Please enter an organization name');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await createOrganization(organizationName, selectedPlan);
      
      if (error) {
        throw new Error(error);
      }
      
      // All done, redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      setError(error.message || 'Failed to create organization');
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'For personal or small projects',
      price: '$0 / month',
      features: ['1 chatbot', '1 team member', '5 documents', '50MB storage']
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'For small businesses',
      price: '$29 / month',
      features: ['3 chatbots', '3 team members', '20 documents', '200MB storage', 'API access']
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For growing businesses',
      price: '$79 / month',
      features: ['10 chatbots', '10 team members', '100 documents', '1GB storage', 'Advanced analytics']
    }
  ];
  
  // Organization name step
  if (step === 1) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to the platform!</CardTitle>
          <CardDescription>Let&apos;s set up your organization</CardDescription>
        </CardHeader>
        <form onSubmit={handleOrganizationSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                placeholder="Acme Inc."
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will be the name of your organization within the platform.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Continue</Button>
          </CardFooter>
        </form>
      </Card>
    );
  }
  
  // Plan selection step
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Choose your plan</CardTitle>
        <CardDescription>Select the plan that fits your needs</CardDescription>
      </CardHeader>
      <form onSubmit={handlePlanSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`flex items-start space-x-3 rounded-lg border p-4 ${selectedPlan === plan.id ? 'border-primary' : 'border-border'}`}>
                <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={plan.id} className="text-base font-medium">
                    {plan.name} - {plan.price}
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {plan.features.map((feature, i) => (
                      <li key={i}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Complete Setup'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}