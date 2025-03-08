"use client";

import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

// Define plan features with TypeScript for type safety
type PlanFeature = {
  name: string;
  included: boolean;
};

type Plan = {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  limits: {
    chatbots: number;
    teamMembers: number;
    documents: number;
    storageMb: number;
  };
  cta: {
    text: string;
    href: string;
  };
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    description: "For personal projects",
    price: {
      monthly: 0,
      yearly: 0
    },
    features: [
      { name: "1 Chatbot", included: true },
      { name: "Basic Analytics", included: true },
      { name: "Website Embedding", included: true },
      { name: "Document Upload (PDF, Docs)", included: true },
      { name: "API Access", included: false },
      { name: "Customization", included: false },
      { name: "Team Collaboration", included: false },
      { name: "Priority Support", included: false }
    ],
    limits: {
      chatbots: 1,
      teamMembers: 1,
      documents: 5,
      storageMb: 50
    },
    cta: {
      text: "Get Started",
      href: "/auth/signup?plan=free"
    }
  },
  {
    name: "Basic",
    description: "For small businesses",
    price: {
      monthly: 29,
      yearly: 299
    },
    features: [
      { name: "3 Chatbots", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Website Embedding", included: true },
      { name: "Document Upload (PDF, Docs)", included: true },
      { name: "API Access", included: true },
      { name: "Basic Customization", included: true },
      { name: "Team Collaboration", included: true },
      { name: "Priority Support", included: false }
    ],
    limits: {
      chatbots: 3,
      teamMembers: 3,
      documents: 20,
      storageMb: 200
    },
    cta: {
      text: "Choose Basic",
      href: "/auth/signup?plan=basic"
    },
    highlighted: true
  },
  {
    name: "Premium",
    description: "For growing businesses",
    price: {
      monthly: 79,
      yearly: 799
    },
    features: [
      { name: "10 Chatbots", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Website Embedding", included: true },
      { name: "Document Upload (PDF, Docs)", included: true },
      { name: "API Access", included: true },
      { name: "Full Customization", included: true },
      { name: "Team Collaboration", included: true },
      { name: "Priority Support", included: true }
    ],
    limits: {
      chatbots: 10,
      teamMembers: 10,
      documents: 100,
      storageMb: 1000
    },
    cta: {
      text: "Choose Premium",
      href: "/auth/signup?plan=premium"
    }
  }
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6 mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-4 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
            Choose the perfect plan for your needs. No hidden fees.
          </p>
        </motion.div>
        
        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center items-center space-x-4"
        >
          <span className={`text-sm font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-sm font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
            Yearly <span className="text-green-600 dark:text-green-400">Save 15%</span>
          </span>
        </motion.div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`relative flex flex-col p-6 rounded-xl border ${
                plan.highlighted 
                  ? 'border-primary shadow-lg dark:border-primary' 
                  : 'border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>
              
              <div className="mt-4 mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl md:text-4xl font-bold">
                    ${isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly}
                  </span>
                  <span className="text-muted-foreground ml-1">/mo</span>
                </div>
                {plan.price.yearly > 0 && isYearly && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ${plan.price.yearly}/year (save 15%)
                  </p>
                )}
              </div>
              
              <ul className="space-y-3 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 border-2 rounded-full border-muted mr-2 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-border my-6 pt-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Chatbots</span>
                    <span className="text-sm font-medium">{plan.limits.chatbots}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Team Members</span>
                    <span className="text-sm font-medium">{plan.limits.teamMembers}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Documents</span>
                    <span className="text-sm font-medium">{plan.limits.documents}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage</span>
                    <span className="text-sm font-medium">{plan.limits.storageMb} MB</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                asChild 
                className="w-full mt-auto" 
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href={`${plan.cta.href}${isYearly ? '&billing=yearly' : ''}`}>
                  {plan.cta.text}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
        
        {/* Enterprise/Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 p-8 rounded-xl border border-border text-center"
        >
          <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Need a custom solution? We offer enterprise plans with dedicated support, 
            custom integrations, advanced security, and more.
          </p>
          <Button asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}