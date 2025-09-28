import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email, message, isUserMessage, sourcePage, chatMode } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get or create chat session
    let { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Create session if it doesn't exist
    if (!session) {
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          session_id: sessionId,
          email: email || null,
          is_email_captured: !!email,
          total_messages: 1
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      session = newSession;
    } else {
      // Update existing session
      const updateData: any = {
        total_messages: session.total_messages + 1
      };

      if (email && !session.email) {
        updateData.email = email;
        updateData.is_email_captured = true;
      }

      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error updating session:', updateError);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }
    }

    // Save message if provided
    if (message) {
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          message_text: message,
          is_user_message: isUserMessage
        });

      if (messageError) {
        console.error('Error saving message:', messageError);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
      }
    }

    // If email was captured, create email capture record
    if (email && !session.email) {
      const { error: emailError } = await supabase
        .from('email_captures')
        .insert({
          email: email,
          session_id: sessionId,
          source_page: sourcePage || 'unknown',
          chat_mode: chatMode || 'default',
          total_messages: session.total_messages + 1
        });

      if (emailError) {
        console.error('Error saving email capture:', emailError);
        return NextResponse.json({ error: 'Failed to save email capture' }, { status: 500 });
      }

      // Send notification to admin (you can implement this with your preferred notification system)
      console.log(`New email captured: ${email} from session ${sessionId}`);
    }

    return NextResponse.json({ 
      success: true, 
      session: {
        id: session.id,
        session_id: sessionId,
        email: email || session.email,
        is_email_captured: !!email || session.is_email_captured,
        total_messages: session.total_messages + 1
      }
    });

  } catch (error) {
    console.error('Chat session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session with messages
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session,
      messages: messages || []
    });

  } catch (error) {
    console.error('Chat session GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
