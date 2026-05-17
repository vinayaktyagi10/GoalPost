import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email not sent:', { to, subject })
    return
  }

  try {
    await resend.emails.send({
      from: 'GoalPost <onboarding@resend.dev>',
      to: process.env.DEMO_EMAIL || to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}
