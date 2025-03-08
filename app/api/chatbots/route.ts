import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          }
        }
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const {
      name,
      description,
      systemPrompt,
      welcomeMessage,
      temperature,
      model,
      useRag,
      organizationId
    } = await req.json();
    
    // Validate required fields
    if (!name || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('organization_id', organizationId)
      .single();
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }
    
    // Create chatbot
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .insert({
        name,
        description,
        system_prompt: systemPrompt,
        welcome_message: welcomeMessage,
        temperature: parseFloat(temperature) || 0.7,
        model: model || 'gpt-3.5-turbo',
        use_rag: useRag ?? true,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(chatbot);
  } catch (error: any) {
    console.error('Error creating chatbot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chatbot' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          }
        }
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('organization_id', organizationId)
      .single();
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }
    
    // Get chatbots
    const { data: chatbots, error } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        description,
        avatar_url,
        system_prompt,
        welcome_message,
        temperature,
        model,
        is_active,
        use_rag,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(chatbots);
  } catch (error: any) {
    console.error('Error fetching chatbots:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chatbots' },
      { status: 500 }
    );
  }
}