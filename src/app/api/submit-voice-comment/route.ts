import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { comment, audioData, songTitle, artistName } = await request.json()

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64')

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // You can change this to the artist's email when available
      subject: `Voice Comment for ${songTitle} by ${artistName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">🎵 New Voice Comment Received</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Song Details</h3>
            <p><strong>Song:</strong> ${songTitle}</p>
            <p><strong>Artist:</strong> ${artistName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Voice Comment</h3>
            <p style="font-style: italic; line-height: 1.6;">"${comment}"</p>
            <p style="margin-top: 15px; font-size: 14px;">
              <strong>Audio recording attached below</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
              This comment was recorded while the listener was enjoying your music on LaunchThatSong.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `voice-comment-${songTitle}-${Date.now()}.webm`,
          content: audioBuffer,
          contentType: 'audio/webm'
        }
      ]
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true, 
      message: 'Voice comment sent successfully' 
    })

  } catch (error) {
    console.error('Error sending voice comment:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send voice comment' 
      },
      { status: 500 }
    )
  }
} 