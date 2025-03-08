"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white">
            Train AI Chatbots on Your Custom Data
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-[700px] mx-auto">
            Create custom AI chatbots trained on your data in minutes. No coding required. Add to your website, share via link, or embed anywhere.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 min-w-[176px] justify-center"
        >
          <Button asChild size="lg" className="text-md font-medium">
            <Link href="/auth/signup">Get Started for Free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-md font-medium">
            <Link href="#features">Learn More</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;