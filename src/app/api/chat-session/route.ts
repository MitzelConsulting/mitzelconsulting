import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email, name, message, isUserMessage, sourcePage, chatMode } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get or create chat session
    let { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
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
          id: sessionId,
          user_email: email || null,
          user_name: name || null,
          source_page: sourcePage || null,
          chat_mode: chatMode || 'default',
          message_count: message ? 1 : 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      session = newSession;
    } else {
      // Update existing session with user info if provided
      const updateData: any = {};

      if (email && !session.user_email) {
        updateData.user_email = email;
      }
      if (name && !session.user_name) {
        updateData.user_name = name;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update(updateData)
          .eq('id', sessionId);

        if (updateError) {
          console.error('Error updating session:', updateError);
          return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }
      }
    }

    // Save message if provided
    if (message) {
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          message: message,
          is_user_message: isUserMessage
        });

      if (messageError) {
        console.error('Error saving message:', messageError);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
      }
    }

    // If email was captured, create email capture record
    if (email) {
      const { error: emailError } = await supabase
        .from('email_captures')
        .upsert({
          session_id: sessionId,
          email: email,
          name: name || null,
          source_page: sourcePage || 'unknown',
          chat_mode: chatMode || 'default'
        }, {
          onConflict: 'session_id,email'
        });

      if (emailError) {
        console.error('Error saving email capture:', emailError);
        return NextResponse.json({ error: 'Failed to save email capture' }, { status: 500 });
      }

      // Send notification to admin
      console.log(`New email captured: ${email} (${name || 'No name'}) from session ${sessionId}`);
    }

    return NextResponse.json({ 
      success: true, 
      session: {
        id: sessionId,
        user_email: email || session.user_email,
        user_name: name || session.user_name,
        message_count: session.message_count + (message ? 1 : 0)
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

    // Get session with messages using the function
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('get_chat_session_with_messages', { p_session_id: sessionId });

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData[0];

    return NextResponse.json({
      success: true,
      session: {
        id: session.session_id,
        created_at: session.created_at,
        user_name: session.user_name,
        user_email: session.user_email,
        message_count: session.message_count,
        messages: session.messages
      }
    });

  } catch (error) {
    console.error('Chat session GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
