"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Book,
  Code,
  FileText,
  Globe,
  HelpCircle,
  Lightbulb,
  Play,
  Settings,
  Bot,
  Database,
  MessageSquare,
  Search,
  Lock,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about using and integrating your AI chatbots
        </p>
      </div>
      
      <Tabs defaultValue="getting-started" className="mt-8">
        <div className="flex justify-between items-start">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 mb-6">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="getting-started" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-primary" />
                  <CardTitle>Quickstart</CardTitle>
                </div>
                <CardDescription>Get up and running in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li>Create your first chatbot</li>
                  <li>Upload training documents</li>
                  <li>Customize your chatbot</li>
                  <li>Embed it on your website</li>
                </ul>
                <Button className="mt-4 w-full" asChild>
                  <Link href="/docs/quickstart">Read Quickstart Guide</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Knowledge Base</CardTitle>
                </div>
                <CardDescription>Add custom knowledge to your chatbot</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li>Upload PDFs, docs, and text files</li>
                  <li>Connect to websites</li>
                  <li>Organize your knowledge</li>
                  <li>Update your knowledge base</li>
                </ul>
                <Button className="mt-4 w-full" asChild>
                  <Link href="/docs/knowledge-base">Knowledge Base Guide</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Book className="h-5 w-5 text-primary" />
                <CardTitle>Core Concepts</CardTitle>
              </div>
              <CardDescription>
                Learn about the key concepts behind our chatbot platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Retrieval Augmented Generation (RAG)</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how our chatbots use your documents to provide accurate, contextual responses.
                  </p>
                  <Link href="/docs/concepts/rag">
                    <Button variant="link" className="p-0">Read More →</Button>
                  </Link>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Embeddings & Vector Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand how we convert your text into numeric representations for semantic search.
                  </p>
                  <Link href="/docs/concepts/embeddings">
                    <Button variant="link" className="p-0">Read More →</Button>
                  </Link>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Prompt Engineering</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to craft effective system prompts for better AI responses.
                  </p>
                  <Link href="/docs/concepts/prompts">
                    <Button variant="link" className="p-0">Read More →</Button>
                  </Link>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Multi-tenancy & Teams</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand how organizations, users, and permissions work in our platform.
                  </p>
                  <Link href="/docs/concepts/multi-tenancy">
                    <Button variant="link" className="p-0">Read More →</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guides" className="space-y-6">
          <h2 className="text-2xl font-bold">Step-by-Step Guides</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Beginner</Badge>
                <CardTitle className="text-lg">Creating Your First Chatbot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Learn how to create, configure, and publish your first AI chatbot.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs/guides/first-chatbot">Read Guide</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Intermediate</Badge>
                <CardTitle className="text-lg">Website Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Add your chatbot to any website using our JavaScript widget or iframe.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs/guides/website-integration">Read Guide</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Advanced</Badge>
                <CardTitle className="text-lg">Custom API Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Connect your chatbot to your own applications using our REST API.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs/guides/api-integration">Read Guide</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-6">
          <h2 className="text-2xl font-bold">API Reference</h2>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>REST API</CardTitle>
              </div>
              <CardDescription>
                Interact with your chatbots programmatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn how to authenticate with our API using API keys.
                    </p>
                    <Link href="/docs/api/auth">
                      <Button variant="link" className="p-0">Read More →</Button>
                    </Link>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Chat Endpoints</h3>
                    <p className="text-sm text-muted-foreground">
                      Send messages and receive AI responses through the API.
                    </p>
                    <Link href="/docs/api/chat">
                      <Button variant="link" className="p-0">Read More →</Button>
                    </Link>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Knowledge Base API</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage documents and knowledge programmatically.
                    </p>
                    <Link href="/docs/api/knowledge">
                      <Button variant="link" className="p-0">Read More →</Button>
                    </Link>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Analytics API</h3>
                    <p className="text-sm text-muted-foreground">
                      Access usage statistics and performance metrics.
                    </p>
                    <Link href="/docs/api/analytics">
                      <Button variant="link" className="p-0">Read More →</Button>
                    </Link>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">API Examples</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code>
{`// Send a message to a chatbot
const response = await fetch('https://api.flexybot.com/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    chatbot_id: 'cb_123456789',
    message: 'Hello, how can you help me?'
  })
});

const data = await response.json();
console.log(data.response); // AI's response`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="space-y-6">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle>General Questions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">How does the chatbot know my data?</h3>
                <p className="text-sm text-muted-foreground">
                  Your documents are processed using RAG (Retrieval Augmented Generation) technology. We extract text, break it into chunks, create embeddings, and store them in a vector database. When users ask questions, the system retrieves relevant context from your data and uses it to generate accurate responses.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Can I customize the appearance of my chatbot?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can customize colors, fonts, avatar, and position. Premium plans offer more advanced branding options including removal of our branding.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">How secure is my data?</h3>
                <p className="text-sm text-muted-foreground">
                  Very secure. We use enterprise-grade encryption, multi-tenant isolation, and strict access controls. Your data is never used to train our models, and you maintain complete ownership.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Can I integrate with my existing systems?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, we offer API access on paid plans that allows you to integrate your chatbot with existing systems, CRMs, or custom applications.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">What file types are supported?</h3>
                <p className="text-sm text-muted-foreground">
                  We support PDF, DOCX, TXT, and CSV files. We can also process web pages via URL and have a direct web scraper for website content.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}