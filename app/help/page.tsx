"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Book,
  FileText,
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Search,
  VideoIcon, 
  Bot,
  Database,
  Code,
  Globe,
  Lock,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';

const faqs = [
  {
    question: 'How do I create my first chatbot?',
    answer: (
      <>
        <p className="mb-4">
          Creating your first chatbot is easy! Just follow these steps:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Log in to your dashboard</li>
          <li>Click the "New Chatbot" button</li>
          <li>Give your chatbot a name and description</li>
          <li>Configure basic settings like welcome message</li>
          <li>Upload documents to train your chatbot (optional)</li>
          <li>Test your chatbot in the playground</li>
          <li>Click "Publish" when you're ready</li>
        </ol>
        <p className="mt-4">
          For more detailed instructions, check out our{' '}
          <Link href="/docs/guides/creating-your-first-chatbot" className="text-primary hover:underline">
            comprehensive guide
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    question: 'How do I embed my chatbot on my website?',
    answer: (
      <>
        <p className="mb-4">
          You can embed your chatbot on your website in two ways:
        </p>
        <h4 className="font-semibold mt-4 mb-2">JavaScript Widget (Recommended)</h4>
        <p className="mb-2">
          Add this script to your website before the closing body tag:
        </p>
        <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto mb-4">
          <code>
{`<script>
  (function (w, d, s, o) {
    w['ChatbotWidget'] = o;
    var js = d.createElement(s);
    js.src = 'https://app.chatbuilder.com/widget.js';
    js.async = 1;
    js.dataset.chatbotId = 'YOUR_CHATBOT_ID';
    d.getElementsByTagName('head')[0].appendChild(js);
  })(window, document, 'script', 'chatbot');
</script>`}
          </code>
        </pre>
        
        <h4 className="font-semibold mt-4 mb-2">Iframe Embed</h4>
        <p className="mb-2">
          Alternatively, add this iframe to your page:
        </p>
        <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto">
          <code>
{`<iframe
  src="https://app.chatbuilder.com/embed/YOUR_CHATBOT_ID"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>`}
          </code>
        </pre>
        
        <p className="mt-4">
          You can customize colors, position, and behavior in your chatbot settings. See our{' '}
          <Link href="/docs/guides/embedding" className="text-primary hover:underline">
            embedding guide
          </Link>{' '}
          for more options.
        </p>
      </>
    ),
  },
  {
    question: 'How do I train my chatbot on my documents?',
    answer: (
      <>
        <p className="mb-4">
          To train your chatbot on your own documents:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Go to your chatbot's "Knowledge" tab</li>
          <li>Click "Upload Documents" or "Add Website"</li>
          <li>Select files (PDF, DOCX, TXT, etc.) or enter website URLs</li>
          <li>Wait for processing to complete</li>
          <li>Your chatbot will now use this information when answering questions</li>
        </ol>
        <p className="mt-4">
          For best results, use clear, well-structured documents. Our system will automatically split documents into chunks and create embeddings for semantic search. See our{' '}
          <Link href="/docs/guides/training-documents" className="text-primary hover:underline">
            document training guide
          </Link>{' '}
          for tips.
        </p>
      </>
    ),
  },
  {
    question: 'How do I invite team members?',
    answer: (
      <>
        <p className="mb-4">
          To invite team members to collaborate on your chatbots:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Go to the "Team" section in your dashboard</li>
          <li>Click "Invite Member"</li>
          <li>Enter the email address of your team member</li>
          <li>Select the appropriate role (Admin or Member)</li>
          <li>Click "Send Invitation"</li>
        </ol>
        <p className="mt-4">
          Team members will receive an email invitation. They'll need to create an account (if they don't already have one) and accept the invitation. Note that your subscription plan determines how many team members you can add.
        </p>
      </>
    ),
  },
  {
    question: "What's the difference between the subscription plans?",
    answer: (
      <>
        <p className="mb-4">
          We offer three subscription plans:
        </p>
        <ul className="space-y-4">
          <li>
            <strong>Free:</strong> For personal and small projects
            <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
              <li>1 chatbot</li>
              <li>1 team member</li>
              <li>Up to 5 documents</li>
              <li>50MB storage</li>
              <li>Basic analytics</li>
            </ul>
          </li>
          <li>
            <strong>Basic ($29/month):</strong> For small businesses
            <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
              <li>Up to 3 chatbots</li>
              <li>Up to 3 team members</li>
              <li>Up to 20 documents</li>
              <li>200MB storage</li>
              <li>Advanced analytics</li>
              <li>API access</li>
            </ul>
          </li>
          <li>
            <strong>Premium ($79/month):</strong> For growing businesses
            <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
              <li>Up to 10 chatbots</li>
              <li>Up to 10 team members</li>
              <li>Up to 100 documents</li>
              <li>1GB storage</li>
              <li>Priority support</li>
              <li>Custom branding</li>
              <li>Advanced configurations</li>
            </ul>
          </li>
        </ul>
        <p className="mt-4">
          Visit our{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            pricing page
          </Link>{' '}
          for a detailed comparison of features and limits.
        </p>
      </>
    ),
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to your questions or contact our support team
        </p>
        
        <div className="max-w-lg mx-auto mt-6 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="Search help articles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <Card className="p-6 flex flex-col items-center text-center">
          <FileText className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Documentation</h2>
          <p className="text-muted-foreground mb-4">
            Explore guides, tutorials, and API references
          </p>
          <Link href="/docs">
            <Button>View Documentation</Button>
          </Link>
        </Card>
        
        <Card className="p-6 flex flex-col items-center text-center">
          <VideoIcon className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Video Tutorials</h2>
          <p className="text-muted-foreground mb-4">
            Watch step-by-step video tutorials
          </p>
          <Link href="/help/tutorials">
            <Button>Watch Tutorials</Button>
          </Link>
        </Card>
        
        <Card className="p-6 flex flex-col items-center text-center">
          <Mail className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Contact Support</h2>
          <p className="text-muted-foreground mb-4">
            Get help from our support team
          </p>
          <Link href="/help/contact">
            <Button>Contact Us</Button>
          </Link>
        </Card>
      </div>
      
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        
        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Didn't find what you're looking for?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs">
              <Button variant="outline">
                <Book className="mr-2 h-4 w-4" />
                Browse Documentation
              </Button>
            </Link>
            <Link href="/help/contact">
              <Button variant="outline">
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Link>
            <FeedbackDialog location="help_center" triggerButton={
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Give Feedback
              </Button>
            } />
          </div>
        </div>
      </div>
    </div>
  );
}