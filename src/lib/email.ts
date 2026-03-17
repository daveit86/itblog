import nodemailer from 'nodemailer'
import prisma from './prisma'

// Create transporter - uses database settings or falls back to environment/test accounts
export const createTransporter = async () => {
  // Get admin user with SMTP settings
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpPass: true,
    }
  })

  // Check if SMTP is configured in database
  if (admin?.smtpHost && admin?.smtpUser && admin?.smtpPass) {
    console.log('📧 Using database SMTP configuration:', admin.smtpHost)
    return nodemailer.createTransport({
      host: admin.smtpHost,
      port: admin.smtpPort || 587,
      secure: admin.smtpSecure || false,
      auth: {
        user: admin.smtpUser,
        pass: admin.smtpPass,
      },
    })
  }

  // Fallback to environment variables
  const envHost = process.env.SMTP_HOST?.trim()
  const envUser = process.env.SMTP_USER?.trim()
  const envPass = process.env.SMTP_PASS?.trim()
  
  if (envHost && envUser && envPass) {
    console.log('📧 Using environment SMTP configuration:', envHost)
    return nodemailer.createTransport({
      host: envHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: envUser,
        pass: envPass,
      },
    })
  }

  // For development/testing, create a test account with Ethereal
  console.log('⚠️  No SMTP credentials found. Using test email account (emails will not be delivered).')
  console.log('💡 Configure SMTP in Settings > Email to receive real email notifications.')
  
  const testAccount = await nodemailer.createTestAccount()
  console.log('📧 Test account created:', testAccount.user)
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

// Get admin notification settings
export const getAdminNotificationSettings = async () => {
  // Find the first admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: {
      notifyOnComments: true,
      notifyOnPublish: true,
      adminEmail: true,
      email: true,
    }
  })

  if (!admin) {
    // Fall back to environment variable
    return {
      notifyOnComments: true,
      notifyOnPublish: false,
      email: process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || 'daveit10@gmail.com'
    }
  }

  return {
    notifyOnComments: admin.notifyOnComments,
    notifyOnPublish: admin.notifyOnPublish,
    email: admin.adminEmail?.trim() || admin.email?.trim() || process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || 'daveit10@gmail.com'
  }
}

// Test SMTP connection with better error handling
export const testSMTPConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Get admin user with SMTP settings
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPass: true,
      }
    })

    if (!admin?.smtpHost || !admin?.smtpUser || !admin?.smtpPass) {
      return {
        success: false,
        message: 'SMTP settings not configured. Please fill in all SMTP fields.'
      }
    }

    const port = admin.smtpPort || 587
    const secure = admin.smtpSecure || false

    // Check for common misconfigurations
    if (port === 587 && secure === true) {
      return {
        success: false,
        message: 'Configuration Error: Port 587 uses STARTTLS (not SSL). Please uncheck "Use secure connection (TLS/SSL)".'
      }
    }

    if (port === 465 && secure === false) {
      return {
        success: false,
        message: 'Configuration Error: Port 465 requires SSL/TLS. Please check "Use secure connection (TLS/SSL)".'
      }
    }

    const transporter = nodemailer.createTransport({
      host: admin.smtpHost,
      port: port,
      secure: secure,
      auth: {
        user: admin.smtpUser,
        pass: admin.smtpPass,
      },
      // Add TLS options for better compatibility
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      // Timeout settings
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    await transporter.verify()
    return { success: true, message: 'SMTP connection successful!' }
  } catch (error) {
    console.error('SMTP test failed:', error)

    let message = error instanceof Error ? error.message : 'Failed to connect to SMTP server'

    // Provide helpful error messages for common issues
    if (message.includes('wrong version number') || message.includes('SSL')) {
      message = 'SSL/TLS Error: Wrong port/security combination. ' +
        'For port 587: Use STARTTLS (uncheck secure). ' +
        'For port 465: Use SSL (check secure). ' +
        'Common settings: Gmail (587 + unchecked), Outlook (587 + unchecked), Custom (465 + checked).'
    } else if (message.includes('auth') || message.includes('login') || message.includes('credentials')) {
      message = 'Authentication failed. Please check your username and app password. For Gmail, use an App Password (not your regular password).'
    } else if (message.includes('connect') || message.includes('ETIMEDOUT') || message.includes('ENOTFOUND')) {
      message = 'Connection failed. Please check the SMTP host and port. Make sure your firewall allows outgoing connections on the specified port.'
    }

    return {
      success: false,
      message
    }
  }
}

interface CommentNotificationData {
  authorName: string
  authorEmail?: string
  content: string
  articleTitle: string
  articleSlug: string
  commentId: string
}

export async function sendNewCommentNotification(data: CommentNotificationData) {
  try {
    // Check if admin wants to receive comment notifications
    const settings = await getAdminNotificationSettings()
    
    if (!settings.notifyOnComments) {
      console.log('📧 Comment notification skipped: admin has disabled comment notifications')
      return { success: true, skipped: true }
    }

    console.log('📧 Sending comment notification to:', settings.email)
    
    const transporter = await createTransporter()
    
    const blogUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const adminUrl = `${blogUrl}/admin/comments`
    const articleUrl = `${blogUrl}/blog/${data.articleSlug}`
    
    const mailOptions = {
      from: `"IT Blog Notifications" <noreply@itblog.com>`,
      to: settings.email,
      subject: `📝 New comment on "${data.articleTitle}" - Approval Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📝 New Comment Received</h2>
          
          <p>A new comment has been submitted on your blog and requires approval.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Article</h3>
            <p style="margin: 5px 0;"><strong>${data.articleTitle}</strong></p>
            <a href="${articleUrl}" style="color: #0066cc;">View Article</a>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Comment Details</h3>
            <p style="margin: 5px 0;"><strong>Author:</strong> ${data.authorName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.authorEmail}</p>
            <p style="margin: 5px 0;"><strong>Content:</strong></p>
            <blockquote style="margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; background: white;">
              ${data.content.replace(/\n/g, '<br>')}
            </blockquote>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${adminUrl}" 
               style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
               Approve or Delete Comment
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from your IT Blog. <br>
            You're receiving this because you have comment notifications enabled in your settings. <br>
            Comment ID: ${data.commentId}
          </p>
        </div>
      `,
      text: `
📝 New Comment Received

A new comment has been submitted on "${data.articleTitle}" and requires approval.

Author: ${data.authorName}
Email: ${data.authorEmail}

Comment:
${data.content}

Article URL: ${articleUrl}
Manage Comments: ${adminUrl}

You're receiving this because you have comment notifications enabled in your settings.

Comment ID: ${data.commentId}
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    
    // For test accounts, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log('📧 Test email sent!')
      console.log('📧 Preview URL:', previewUrl)
      console.log('💡 Note: This is a test email. To receive real emails, configure SMTP in Settings.')
    } else {
      console.log('✅ Email sent successfully to:', settings.email)
      console.log('📧 Message ID:', info.messageId)
    }
    
    return { success: true, messageId: info.messageId, previewUrl }
  } catch (error) {
    console.error('❌ Failed to send email notification:', error)
    // Don't throw - we don't want to break the comment submission if email fails
    return { success: false, error: 'Failed to send notification email' }
  }
}

interface PublishNotificationData {
  articleTitle: string
  articleSlug: string
  articleId: string
}

export async function sendArticlePublishedNotification(data: PublishNotificationData) {
  try {
    // Check if admin wants to receive publish notifications
    const settings = await getAdminNotificationSettings()
    
    if (!settings.notifyOnPublish) {
      console.log('📧 Publish notification skipped: admin has disabled publish notifications')
      return { success: true, skipped: true }
    }

    const transporter = await createTransporter()
    
    const blogUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const articleUrl = `${blogUrl}/blog/${data.articleSlug}`
    
    const mailOptions = {
      from: `"IT Blog Notifications" <noreply@itblog.com>`,
      to: settings.email,
      subject: `✅ Article Published: "${data.articleTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">✅ Article Published Successfully</h2>
          
          <p>Your article has been published and is now live on your blog.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">${data.articleTitle}</h3>
            <a href="${articleUrl}" style="color: #0066cc; display: inline-block; margin-top: 10px;">
              View Published Article →
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from your IT Blog. <br>
            You're receiving this because you have publish notifications enabled in your settings.
          </p>
        </div>
      `,
      text: `
✅ Article Published Successfully

Your article "${data.articleTitle}" has been published and is now live on your blog.

View it here: ${articleUrl}

You're receiving this because you have publish notifications enabled in your settings.
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log('📧 Test email sent!')
      console.log('📧 Preview URL:', previewUrl)
    } else {
      console.log('✅ Email sent to admin:', settings.email)
    }
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Failed to send publish notification:', error)
    return { success: false, error: 'Failed to send notification email' }
  }
}

// Export types
export type { CommentNotificationData, PublishNotificationData }
