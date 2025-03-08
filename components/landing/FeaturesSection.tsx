"use client";

import { motion } from 'framer-motion';
import { Bot, Brain, Zap, Lock, Globe, BarChart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
  {
    name: 'RAG Technology',
    description: 'Train your chatbot on your documents using advanced Retrieval Augmented Generation.',
    icon: Brain,
  },
  {
    name: 'Instant Setup',
    description: 'Get your chatbot up and running in minutes with our no-code platform.',
    icon: Zap,
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-grade encryption and data privacy controls for your sensitive information.',
    icon: Lock,
  },
  {
    name: 'Multi-Channel',
    description: 'Deploy your chatbot across web, mobile, and popular messaging platforms.',
    icon: Globe,
  },
  {
    name: 'Smart Responses',
    description: 'AI-powered responses that understand context and maintain conversation flow.',
    icon: Bot,
  },
  {
    name: 'Analytics & Insights',
    description: "Detailed analytics and insights to optimize your chatbot's performance.",
    icon: BarChart,
  },
];

const steps = [
  {
    number: '01',
    title: 'Upload Your Data',
    description: 'Simply upload your documents, FAQs, or knowledge base articles.',
  },
  {
    number: '02',
    title: 'Train Your Bot',
    description: 'Our AI automatically processes and learns from your content.',
  },
  {
    number: '03',
    title: 'Deploy Anywhere',
    description: 'Embed on your website or integrate with your favorite platforms.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-20 bg-muted/50">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Powerful Features for Modern AI Chatbots
          </h2>
          <p className="text-lg text-muted-foreground max-w-[800px] mx-auto">
            Everything you need to build, train, and deploy AI chatbots that understand your business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300" />
              <div className="relative p-6 space-y-4">
                <feature.icon className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-semibold">{feature.name}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-[800px] mx-auto">
            Get started in minutes with three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/4 left-full transform -translate-x-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <h3 className="text-2xl font-semibold">Ready to get started?</h3>
          <p className="text-muted-foreground max-w-[600px] mx-auto">
            Create your first AI chatbot in minutes. No credit card required.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Start Building for Free</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;