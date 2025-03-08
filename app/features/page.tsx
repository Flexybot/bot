"use client";

import { motion } from 'framer-motion';
import { Bot, Brain, Zap, Lock, Globe, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: 'RAG Technology',
    description: 'Train your chatbot on your documents using advanced Retrieval Augmented Generation.',
    icon: Brain,
  },
  {
    title: 'Instant Setup',
    description: 'Get your chatbot up and running in minutes with our no-code platform.',
    icon: Zap,
  },
  {
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and data privacy controls for your sensitive information.',
    icon: Lock,
  },
  {
    title: 'Multi-Channel',
    description: 'Deploy your chatbot across web, mobile, and popular messaging platforms.',
    icon: Globe,
  },
  {
    title: 'Smart Responses',
    description: 'AI-powered responses that understand context and maintain conversation flow.',
    icon: Bot,
  },
  {
    title: 'Analytics & Insights',
    description: "Detailed analytics and insights to optimize your chatbot's performance.",
    icon: BarChart,
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4 mb-16"
      >
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
          Powerful Features for Modern AI Chatbots
        </h1>
        <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
          Our platform combines cutting-edge AI with enterprise-grade tools to build chatbots that truly understand your content.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}