import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const chatbotId = params.chatbotId;
    
    // First try authenticated access
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
    
    if (session) {
      // Get chatbot with auth
      const { data: chatbot, error } = await supabase
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
          organization_id,
          created_at,
          updated_at
        `)
        .eq('id', chatbotId)
        .single();
      
      if (error) {
        // If error, check if it's a not found or permission error
        if (error.code === 'PGRST116') {
          // Try public access
          return getPublicChatbot(chatbotId);
        }
        
        throw error;
      }
      
      // Check if user has access to the organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('organization_id', chatbot.organization_id)
        .single();
      
      if (!membership) {
        // If no membership, try public access
        return getPublicChatbot(chatbotId);
      }
      
      return NextResponse.json(chatbot);
    } else {
      // Not authenticated, try public access
      return getPublicChatbot(chatbotId);
    }
  } catch (error: any) {
    console.error('Error fetching chatbot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chatbot' },
      { status: 500 }
    );
  }
}

// Function to get public chatbot data (only public fields)
async function getPublicChatbot(chatbotId: string) {
  const { data: chatbot, error } = await adminSupabase
    .from('chatbots')
    .select(`
      id,
      name,
      avatar_url,
      welcome_message,
      is_active,
      use_rag,
      created_at
    `)
    .eq('id', chatbotId)
    .eq('is_active', true)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Chatbot not found or not accessible' },
        { status: 404 }
      );
    }
    
    throw error;
  }
  
  return NextResponse.json(chatbot);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
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
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const updates = await req.json();
    
    // Get chatbot to verify ownership
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('organization_id')
      .eq('id', params.chatbotId)
      .single();
    
    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', chatbot.organization_id)
      .single();
    
    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Unauthorized access to chatbot' },
        { status: 403 }
      );
    }
    
    // Only allow specific fields to be updated
    const allowedUpdates = [
      'name',
      'description',
      'avatar_url',
      'system_prompt',
      'welcome_message',
      'temperature',
      'model',
      'is_active',
      'use_rag'
    ];
    
    const sanitizedUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);
    
    // Add updated_at timestamp
    sanitizedUpdates.updated_at = new Date().toISOString();
    
    // Update chatbot
    const { data: updatedChatbot, error: updateError } = await supabase
      .from('chatbots')
      .update(sanitizedUpdates)
      .eq('id', params.chatbotId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json(updatedChatbot);
  } catch (error: any) {
    console.error('Error updating chatbot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chatbot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
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
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get chatbot to verify ownership
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('organization_id')
      .eq('id', params.chatbotId)
      .single();
    
    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }
    
    // Check if user has admin/owner access to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', chatbot.organization_id)
      .single();
    
    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete chatbot' },
        { status: 403 }
      );
    }
    
    // Delete chatbot
    const { error: deleteError } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', params.chatbotId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting chatbot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chatbot' },
      { status: 500 }
    );
  }
}