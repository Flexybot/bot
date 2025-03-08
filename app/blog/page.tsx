"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Sample blog posts data
const posts = [
  {
    id: 1,
    title: 'Getting Started with RAG Technology',
    description: 'Learn how to implement Retrieval Augmented Generation in your chatbots for better accuracy and context awareness.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    author: 'Sarah Johnson',
    date: '2024-03-15',
    readTime: '8 min read',
    category: 'Technical',
  },
  {
    id: 2,
    title: 'Best Practices for Training AI Chatbots',
    description: 'Discover the key principles and strategies for training effective AI chatbots that deliver value to your users.',
    image: 'https://images.unsplash.com/photo-1675256023762-d4b864abd683',
    author: 'Michael Chen',
    date: '2024-03-10',
    readTime: '6 min read',
    category: 'Guides',
  },
  {
    id: 3,
    title: 'The Future of Customer Service with AI',
    description: 'Explore how AI chatbots are transforming customer service and what this means for businesses.',
    image: 'https://images.unsplash.com/photo-1676320831395-7b53552eab0b',
    author: 'Emily Davis',
    date: '2024-03-05',
    readTime: '5 min read',
    category: 'Industry',
  },
];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Latest Insights & Updates
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Discover articles, guides, and insights about AI chatbots, machine learning, and customer service automation.
            </p>
            <div className="w-full max-w-sm space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container px-4 md:px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.readTime}
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/blog/${post.id}`}>
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}