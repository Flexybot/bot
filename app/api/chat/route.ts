import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;

// Create OpenAI client with runtime check
const getOpenAIClient = () => {
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

export async function POST(req: Request) {
  try {
    // Get request body
    const { messages, systemPrompt, temperature = 0.7, useRag = true } = await req.json();

    // Validate inputs
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 });
    }

    // Check for API key at runtime
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create OpenAI client
    const openai = getOpenAIClient();

    // Prepare messages array with system prompt
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful AI assistant.',
      },
      ...messages,
    ];

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: apiMessages,
      temperature: parseFloat(temperature.toString()),
      stream: true,
    });

    // Create stream response
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
}