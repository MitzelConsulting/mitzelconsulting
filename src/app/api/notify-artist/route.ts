import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, purchaseSessionId, type, artistName, email } = body

    if (!artistId) {
      return NextResponse.json(
        { success: false, message: 'Missing artist ID' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Handle signup confirmation email
    if (type === 'signup_confirmation') {
      console.log('Sending signup confirmation email to:', email)
      
      // Check if email credentials are available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email credentials not configured')
        return NextResponse.json(
          { success: false, message: 'Email service not configured' },
          { status: 500 }
        )
      }

      const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login?verified=true`
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🎵 Welcome to Launch That Song - Verify Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 28px;">🎵 Launch That Song</h1>
                <p style="color: #64748b; margin: 10px 0 0 0;">Welcome to the community!</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; font-size: 24px;">Welcome, ${artistName}!</h2>
                <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                  Your artist account has been created successfully! To complete your registration and access your dashboard, please verify your email address.
                </p>
              </div>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0;">📋 What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li>Click the verification button below</li>
                  <li>Log in with your email and password</li>
                  <li>Access your artist dashboard</li>
                  <li>Manage your songs and view analytics</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                  ✅ Verify Email & Login
                </a>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>💡 Note:</strong> Your account and first song are currently pending admin approval. You'll be notified once approved!
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  This email was sent from Launch That Song.<br>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #3b82f6;">Visit LaunchThatSong.com</a>
                </p>
              </div>
            </div>
          </div>
        `
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log('Signup confirmation email sent successfully to:', email)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Signup confirmation email sent successfully',
          artistName
        })
      } catch (emailError) {
        console.error('Failed to send signup confirmation email:', emailError)
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error'
        return NextResponse.json(
          { success: false, message: 'Failed to send confirmation email: ' + errorMessage },
          { status: 500 }
        )
      }
    }

    // Handle voice comment notifications (existing functionality)
    if (!purchaseSessionId) {
      return NextResponse.json(
        { success: false, message: 'Missing purchase session ID for voice comments' },
        { status: 400 }
      )
    }

    // Get artist information
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, name, email')
      .eq('id', artistId)
      .single()

    if (artistError || !artist) {
      return NextResponse.json(
        { success: false, message: 'Artist not found' },
        { status: 404 }
      )
    }

    // Get voice comments for this purchase
    const { data: voiceComments, error: commentsError } = await supabase
      .from('voice_comments')
      .select('*')
      .eq('artist_id', artistId)
      .eq('purchase_session_id', purchaseSessionId)
      .eq('status', 'purchased')

    if (commentsError) {
      console.error('Error fetching voice comments:', commentsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch voice comments' },
        { status: 500 }
      )
    }

    if (!voiceComments || voiceComments.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No voice comments found' },
        { status: 404 }
      )
    }

    // Prepare email content for voice comments
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/artist-dashboard`
    const commentCount = voiceComments.length
    const songNames = [...new Set(voiceComments.map(c => c.song_title))].join(', ')

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: artist.email || process.env.EMAIL_USER, // Fallback to admin email if artist email not set
      subject: `🎵 New Voice Comments Received - ${commentCount} comment${commentCount > 1 ? 's' : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0; font-size: 28px;">🎵 Launch That Song</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">Your fans are speaking up!</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; font-size: 24px;">New Voice Comments Received!</h2>
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                Hi ${artist.name},<br><br>
                You've received <strong>${commentCount} new voice comment${commentCount > 1 ? 's' : ''}</strong> from your fans!
              </p>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0;">📊 Comment Summary</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li><strong>Comments received:</strong> ${commentCount}</li>
                <li><strong>Songs with comments:</strong> ${songNames}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                🚀 View Comments in Dashboard
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>💡 Pro tip:</strong> Connect your Stripe account in the dashboard to receive payouts from your song votes!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This email was sent from Launch That Song.<br>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #3b82f6;">Visit LaunchThatSong.com</a>
              </p>
            </div>
          </div>
        </div>
      `
    }

    // Send email
    await transporter.sendMail(mailOptions)

    // Update voice comments status to 'sent'
    const { error: updateError } = await supabase
      .from('voice_comments')
      .update({ status: 'sent' })
      .eq('artist_id', artistId)
      .eq('purchase_session_id', purchaseSessionId)
      .eq('status', 'purchased')

    if (updateError) {
      console.error('Error updating voice comments status:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Artist notification sent successfully',
      commentCount,
      artistName: artist.name
    })

  } catch (error) {
    console.error('Error sending artist notification:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 }
    )
  }
} 