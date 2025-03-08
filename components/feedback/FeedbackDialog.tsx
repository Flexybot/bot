"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MessageSquare, ThumbsUp, ThumbsDown, Smile, Frown, Meh, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logging';

interface FeedbackDialogProps {
  location: string;
  triggerButton?: React.ReactNode;
  onFeedbackSubmitted?: () => void;
}

type FeedbackType = 'suggestion' | 'issue' | 'compliment' | 'other';
type SatisfactionLevel = 'positive' | 'neutral' | 'negative';

export function FeedbackDialog({ 
  location, 
  triggerButton,
  onFeedbackSubmitted 
}: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>('neutral');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Feedback required',
        description: 'Please enter your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get current organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .single();
      
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          feedback_type: feedbackType,
          satisfaction_level: satisfaction,
          feedback: feedback.trim(),
          location,
          user_id: session?.user?.id,
          organization_id: orgMember?.organization_id,
          metadata: {
            userAgent: navigator.userAgent,
            screenSize: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            url: window.location.href,
          },
        });
        
      if (error) throw error;
      
      // Log successful feedback submission
      logger.info('Feedback submitted', {
        type: feedbackType,
        satisfaction,
        location,
      });
      
      toast({
        title: 'Feedback sent',
        description: 'Thank you for your feedback! We appreciate your input.',
      });
      
      // Reset form and close dialog
      setFeedback('');
      setFeedbackType('suggestion');
      setSatisfaction('neutral');
      setOpen(false);
      
      // Call callback if provided
      onFeedbackSubmitted?.();
      
    } catch (error: any) {
      logger.error('Error submitting feedback', error);
      
      toast({
        title: 'Error sending feedback',
        description: 'There was a problem sending your feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve our platform. Tell us what you think!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>What type of feedback do you have?</Label>
            <RadioGroup
              value={feedbackType}
              onValueChange={(value) => setFeedbackType(value as FeedbackType)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestion" id="suggestion" />
                <Label htmlFor="suggestion">Suggestion</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="issue" id="issue" />
                <Label htmlFor="issue">Issue or Bug</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compliment" id="compliment" />
                <Label htmlFor="compliment">Compliment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>How would you rate your experience?</Label>
            <div className="flex justify-center items-center space-x-8 py-2">
              <button
                type="button"
                onClick={() => setSatisfaction('negative')}
                className={`flex flex-col items-center space-y-1 p-2 rounded-md transition-colors ${
                  satisfaction === 'negative' 
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Frown className="h-8 w-8" />
                <span className="text-xs">Unhappy</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSatisfaction('neutral')}
                className={`flex flex-col items-center space-y-1 p-2 rounded-md transition-colors ${
                  satisfaction === 'neutral' 
                    ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Meh className="h-8 w-8" />
                <span className="text-xs">Neutral</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSatisfaction('positive')}
                className={`flex flex-col items-center space-y-1 p-2 rounded-md transition-colors ${
                  satisfaction === 'positive' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smile className="h-8 w-8" />
                <span className="text-xs">Happy</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback">Your feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting || !feedback.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}