"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="text-4xl mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  popular?: boolean;
}

function PricingCard({ title, price, description, features, buttonText, buttonLink, popular = false }: PricingCardProps) {
  return (
    <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant={popular ? 'default' : 'outline'}>
          <Link href={buttonLink}>{buttonText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Create Custom AI Chatbots with Your Data
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Build, customize, and deploy AI chatbots trained on your own data in minutes. No coding required.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-up" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  Get Started
                </Link>
                <Link href="/demo" className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  View Demo
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-video overflow-hidden rounded-xl border bg-background shadow-xl">
                <Image 
                  src="https://images.unsplash.com/photo-1617042375876-a13e36732a04?q=80&w=2070&auto=format&fit=crop"
                  alt="Platform Demo" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Powerful AI Features</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Our platform combines cutting-edge AI with enterprise-grade tools to build chatbots that truly understand your content.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <FeatureCard 
              title="RAG Technology" 
              description="Train your chatbot on your documents, websites, and knowledge base using Retrieval Augmented Generation." 
              icon="📚" 
            />
            <FeatureCard 
              title="Multi-Tenant Platform" 
              description="Manage multiple chatbots with team collaboration, analytics, and customization options." 
              icon="👥" 
            />
            <FeatureCard 
              title="Easy Integration" 
              description="Embed your chatbot anywhere with simple JavaScript, WordPress plugin, or API access." 
              icon="🔌" 
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Choose the plan that&apos;s right for you. All plans include core features.
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 pt-12 lg:grid-cols-3 lg:gap-8">
            <PricingCard
              title="Free"
              price="$0"
              description="Perfect for personal projects and testing."
              features={[
                "1 Chatbot",
                "5 Documents",
                "50MB Storage",
                "Basic Customization",
                "Community Support"
              ]}
              buttonText="Get Started"
              buttonLink="/sign-up?plan=free"
              popular={false}
            />
            
            <PricingCard
              title="Basic"
              price="$29"
              description="Great for small businesses and professionals."
              features={[
                "3 Chatbots",
                "20 Documents",
                "200MB Storage",
                "Full Customization",
                "API Access",
                "Email Support"
              ]}
              buttonText="Get Started"
              buttonLink="/sign-up?plan=basic"
              popular={true}
            />
            
            <PricingCard
              title="Premium"
              price="$79"
              description="For growing teams with advanced needs."
              features={[
                "10 Chatbots",
                "100 Documents",
                "1GB Storage",
                "Advanced Analytics",
                "Priority Support",
                "Team Collaboration"
              ]}
              buttonText="Get Started"
              buttonLink="/sign-up?plan=premium"
              popular={false}
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Need a custom plan for your enterprise?
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}