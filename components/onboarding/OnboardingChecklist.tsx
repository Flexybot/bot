"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ExternalLink, Loader2 } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

export function OnboardingChecklist() {
  const { currentOrganization } = useOrganization();
  const [tasks, setTasks] = useState<OnboardingTask[]>([
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your name, avatar, and organization details',
      href: '/dashboard/settings/profile',
      completed: false,
    },
    {
      id: 'create_chatbot',
      title: 'Create your first chatbot',
      description: 'Set up a basic chatbot with custom settings',
      href: '/dashboard/chatbots/new',
      completed: false,
    },
    {
      id: 'upload_docs',
      title: 'Upload knowledge documents',
      description: 'Train your chatbot on your own data',
      href: '/dashboard/knowledge',
      completed: false,
    },
    {
      id: 'test_chatbot',
      title: 'Test your chatbot',
      description: 'Try out your chatbot in the playground',
      href: '/dashboard/chatbots',
      completed: false,
    },
    {
      id: 'embed_chatbot',
      title: 'Embed your chatbot',
      description: 'Add your chatbot to your website',
      href: '/dashboard/chatbots',
      completed: false,
    },
  ]);
  
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load task completion status
  useEffect(() => {
    const loadTasks = async () => {
      if (!currentOrganization?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get organization onboarding data
        const { data: onboardingData, error: fetchError } = await supabase
          .from('organization_onboarding')
          .select('completed_tasks')
          .eq('organization_id', currentOrganization.id)
          .single();
          
        if (fetchError) {
          throw fetchError;
        }
          
        if (onboardingData?.completed_tasks) {
          const completedTaskIds = onboardingData.completed_tasks;
          
          // Update tasks with completion status
          setTasks(prevTasks => 
            prevTasks.map(task => ({
              ...task,
              completed: completedTaskIds.includes(task.id)
            }))
          );
        }
        
        // Log successful load
        logger.info('Onboarding tasks loaded', {
          organizationId: currentOrganization.id,
          completedTasks: onboardingData?.completed_tasks?.length || 0
        });
        
      } catch (err: any) {
        logger.error('Error loading onboarding tasks', err);
        setError('Failed to load onboarding progress');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTasks();
  }, [currentOrganization?.id]);
  
  // Update progress when tasks change
  useEffect(() => {
    const completedCount = tasks.filter(task => task.completed).length;
    const progressValue = (completedCount / tasks.length) * 100;
    setProgress(progressValue);
  }, [tasks]);
  
  // Mark a task as completed
  const completeTask = async (taskId: string) => {
    if (!currentOrganization?.id) return;
    
    try {
      setError(null);
      
      // Update local state optimistically
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );
      
      // Get completed task IDs
      const completedTaskIds = tasks
        .filter(task => task.id === taskId || task.completed)
        .map(task => task.id);
      
      // Update database
      const { data: existingRecord } = await supabase
        .from('organization_onboarding')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .single();
        
      if (existingRecord) {
        await supabase
          .from('organization_onboarding')
          .update({
            completed_tasks: completedTaskIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id);
      } else {
        await supabase
          .from('organization_onboarding')
          .insert({
            organization_id: currentOrganization.id,
            completed_tasks: completedTaskIds,
          });
      }
      
      // Log task completion
      logger.info('Onboarding task completed', {
        taskId,
        organizationId: currentOrganization.id,
        progress: Math.round((completedTaskIds.length / tasks.length) * 100)
      });
      
    } catch (err: any) {
      logger.error('Error updating task status', err);
      setError('Failed to update task status');
      
      // Revert optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: false } : task
        )
      );
    }
  };
  
  // If all tasks are completed
  const allCompleted = tasks.every(task => task.completed);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
        <CardDescription>
          Complete these steps to set up your chatbot platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Your progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full mt-0.5 ${
                      task.completed 
                        ? 'text-green-500 hover:text-green-600' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => !task.completed && completeTask(task.id)}
                    disabled={isLoading}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                    <span className="sr-only">
                      {task.completed ? 'Completed' : 'Mark as completed'}
                    </span>
                  </Button>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <Link href={task.href}>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          {task.completed ? 'View' : 'Start'} 
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {allCompleted && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
              <h3 className="font-medium text-green-800 dark:text-green-400 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                All set up!
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-500">
                You've completed all the getting started tasks. 
                Ready to explore more advanced features?
              </p>
              <Link href="/docs/advanced-features">
                <Button variant="outline" size="sm" className="mt-3 border-green-200 text-green-700 hover:text-green-800 dark:border-green-800 dark:text-green-400">
                  Explore Advanced Features
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}