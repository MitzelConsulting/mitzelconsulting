import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const artistName = formData.get('artistName') as string
    const email = formData.get('email') as string
    const songName = formData.get('songName') as string
    const bio = formData.get('bio') as string
    const soundcloudLink = formData.get('soundcloudLink') as string
    const website = formData.get('website') as string
    const message = formData.get('message') as string
    const agreeToTerms = formData.get('agreeToTerms') as string
    const songFile = formData.get('songFile') as File

    // Validate required fields
    if (!artistName || !email || !songName || !bio || !agreeToTerms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create email content
    const emailContent = `
New Song Submission

Artist Name: ${artistName}
Email: ${email}
Song Name: ${songName}
Bio: ${bio}
SoundCloud Link: ${soundcloudLink || 'Not provided'}
Website: ${website || 'Not provided'}
Message: ${message || 'Not provided'}
Agreed to Terms: ${agreeToTerms === 'true' ? 'Yes' : 'No'}

${songFile ? `Song File: ${songFile.name} (${songFile.size} bytes)` : 'No song file uploaded'}
    `.trim()

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'hello@launchthatsong.com',
      subject: `New Song Submission: ${songName} by ${artistName}`,
      text: emailContent,
      html: `
        <h2>New Song Submission</h2>
        <p><strong>Artist Name:</strong> ${artistName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Song Name:</strong> ${songName}</p>
        <p><strong>Bio:</strong> ${bio}</p>
        ${soundcloudLink ? `<p><strong>SoundCloud Link:</strong> <a href="${soundcloudLink}">${soundcloudLink}</a></p>` : ''}
        ${website ? `<p><strong>Website:</strong> <a href="${website}">${website}</a></p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p><strong>Agreed to Terms:</strong> ${agreeToTerms === 'true' ? 'Yes' : 'No'}</p>
        ${songFile ? `<p><strong>Song File:</strong> ${songFile.name} (${songFile.size} bytes)</p>` : ''}
      `,
      attachments: songFile ? [
        {
          filename: songFile.name,
          content: Buffer.from(await songFile.arrayBuffer()),
        }
      ] : []
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'Song submission sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send song submission' },
      { status: 500 }
    )
  }
} 