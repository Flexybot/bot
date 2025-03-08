"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Webhook, Database, Bot, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const integrations = [
  {
    title: 'REST API',
    description: 'Access your chatbots programmatically using our REST API',
    icon: Code2,
    href: '/docs/api',
    status: 'available'
  },
  {
    title: 'Webhooks',
    description: 'Get real-time notifications for chatbot events',
    icon: Webhook,
    href: '/docs/webhooks',
    status: 'coming-soon'
  },
  {
    title: 'Database Sync',
    description: 'Sync your chatbot data with external databases',
    icon: Database,
    href: '/docs/database-sync',
    status: 'coming-soon'
  }
];

const platforms = [
  {
    name: 'WordPress',
    description: 'Add your chatbot to any WordPress site with our plugin',
    status: 'available'
  },
  {
    name: 'Shopify',
    description: 'Integrate your chatbot with your Shopify store',
    status: 'coming-soon'
  },
  {
    name: 'Slack',
    description: 'Connect your chatbot to Slack channels',
    status: 'coming-soon'
  },
  {
    name: 'Discord',
    description: 'Add your chatbot to Discord servers',
    status: 'coming-soon'
  },
  {
    name: 'Microsoft Teams',
    description: 'Use your chatbot in Teams channels',
    status: 'coming-soon'
  },
  {
    name: 'WhatsApp',
    description: 'Deploy your chatbot on WhatsApp',
    status: 'coming-soon'
  }
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your chatbots with your favorite platforms and tools
        </p>
      </div>

      {/* Developer Tools */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Developer Tools</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.title} className="relative">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <integration.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.title}</CardTitle>
                    {integration.status === 'coming-soon' && (
                      <span className="absolute top-4 right-4 text-xs bg-muted px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{integration.description}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={integration.status === 'coming-soon'}
                  asChild
                >
                  <Link href={integration.href}>
                    View Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Integrations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Platform Integrations</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <Card key={platform.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                  {platform.status === 'coming-soon' && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{platform.description}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={platform.status === 'coming-soon'}
                >
                  {platform.status === 'available' ? 'Install Now' : 'Coming Soon'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Need a Custom Integration?</CardTitle>
          <CardDescription>
            Work with our team to build a custom integration for your specific needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}