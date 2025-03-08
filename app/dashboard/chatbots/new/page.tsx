"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, ArrowRight, Loader2 } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { UsageLimitAlert } from '@/components/billing/UsageLimitAlert';

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'Chatbot name must be at least 3 characters',
  }),
  description: z.string().optional(),
  model: z.string({
    required_error: 'Please select a model',
  }),
  welcomeMessage: z.string().min(1, {
    message: 'Welcome message is required',
  }),
  systemPrompt: z.string().min(1, {
    message: 'System prompt is required',
  }),
  temperature: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Temperature must be a number',
  }),
});

export default function NewChatbotPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      model: 'gpt-3.5-turbo',
      welcomeMessage: 'Hello! How can I help you today?',
      systemPrompt: "You're a helpful assistant.",
      temperature: '0.7',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentOrganization) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/chatbots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          organizationId: currentOrganization.id,
          model: values.model,
          welcomeMessage: values.welcomeMessage,
          systemPrompt: values.systemPrompt,
          temperature: parseFloat(values.temperature),
          useRag: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create chatbot');
      }

      const chatbot = await response.json();

      toast({
        title: 'Success',
        description: 'Chatbot created successfully',
      });

      router.push(`/dashboard/chatbots/${chatbot.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create chatbot',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Chatbot</h2>
        <p className="text-muted-foreground">
          Configure your chatbot's basic settings. You can add knowledge sources later.
        </p>
      </div>

      <UsageLimitAlert
        resourceType="chatbots"
        action="create a new chatbot"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details for your new chatbot
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chatbot Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Customer Support Bot" {...field} />
                    </FormControl>
                    <FormDescription>
                      This name will be displayed to your users.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this chatbot does..." 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Internal description to help you identify this chatbot.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the AI model that powers your chatbot.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select temperature" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0.2">0.2 - More focused</SelectItem>
                          <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                          <SelectItem value="0.7">0.7 - Default</SelectItem>
                          <SelectItem value="0.9">0.9 - More creative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Controls randomness: lower for factual, higher for creative.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hello! How can I help you today?" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This message is shown when a user first interacts with your chatbot.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="You're a helpful assistant..." 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Instructions that define how your chatbot behaves and responds.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Chatbot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}