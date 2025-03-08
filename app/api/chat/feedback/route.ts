import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get current user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { messageId, chatId, feedback } = await req.json();
    
    // Validate inputs
    if (!messageId || !chatId || typeof feedback !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the chat to verify ownership and access
    const { data: chat } = await supabase
      .from('chats')
      .select('id, organization_id')
      .eq('id', chatId)
      .single();
    
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Check user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('organization_id', chat.organization_id)
      .single();
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized access to chat' },
        { status: 403 }
      );
    }
    
    // Store feedback
    const { error } = await supabase
      .from('message_feedback')
      .upsert({
        message_id: messageId,
        chat_id: chatId,
        user_id: session.user.id,
        is_helpful: feedback,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'message_id,user_id',
      });
    
    if (error) {
      throw error;
    }
    
    // Update message statistics
    await supabase.rpc('update_message_stats', {
      p_message_id: messageId,
      p_is_helpful: feedback
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}