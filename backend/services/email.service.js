import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
    // If using Gmail (requires app password for production)
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // For development, use ethereal.email (fake email service)
    if (process.env.NODE_ENV !== 'production') {
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'test@ethereal.email',
                pass: 'test',
            },
        });
    }

    // No email configured
    return null;
};

const transporter = createTransporter();

// Email templates
const templates = {
    welcome: (name) => ({
        subject: 'Welcome to ArtistSync!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">Welcome to ArtistSync! 🎵</h2>
                <p>Hi ${name},</p>
                <p>Welcome to ArtistSync! We're excited to have you join our community of artists and venues.</p>
                <p>Here's what you can do:</p>
                <ul>
                    <li>Create your profile and showcase your work</li>
                    <li>Discover and connect with other artists and venues</li>
                    <li>Find and create events</li>
                    <li>Book gigs and grow your network</li>
                </ul>
                <p>Get started by completing your profile.</p>
                <p>See you soon,<br>The ArtistSync Team</p>
            </div>
        `,
    }),

    passwordReset: (name, resetUrl) => ({
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">Reset Your Password</h2>
                <p>Hi ${name},</p>
                <p>You requested to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Thanks,<br>The ArtistSync Team</p>
            </div>
        `,
    }),

    eventInvitation: (name, eventName, eventUrl, venueName) => ({
        subject: `You're invited to ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">🎵 Event Invitation</h2>
                <p>Hi ${name},</p>
                <p>You've been invited to perform at <strong>${eventName}</strong> at ${venueName}!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${eventUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Event Details</a>
                </div>
                <p>Log in to ArtistSync to accept or decline this invitation.</p>
                <p>Thanks,<br>The ArtistSync Team</p>
            </div>
        `,
    }),

    bookingConfirmed: (name, eventName, eventUrl) => ({
        subject: `Booking Confirmed: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">✅ Booking Confirmed!</h2>
                <p>Hi ${name},</p>
                <p>Great news! Your booking for <strong>${eventName}</strong> has been confirmed.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${eventUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Event Details</a>
                </div>
                <p>Get ready for an amazing show!</p>
                <p>Thanks,<br>The ArtistSync Team</p>
            </div>
        `,
    }),

    newMessage: (name, senderName, messageUrl) => ({
        subject: `New message from ${senderName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">💬 New Message</h2>
                <p>Hi ${name},</p>
                <p>You have a new message from <strong>${senderName}</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${messageUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Read Message</a>
                </div>
                <p>Thanks,<br>The ArtistSync Team</p>
            </div>
        `,
    }),
};

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
export const sendEmail = async (to, subject, html) => {
    if (!transporter) {
        console.log('Email not configured. Skipping email send.');
        return { success: false, message: 'Email not configured' };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'ArtistSync <noreply@artistsync.com>',
            to,
            subject,
            html,
        });

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, name) => {
    const template = templates.welcome(name);
    return await sendEmail(email, template.subject, template.html);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
    const template = templates.passwordReset(name, resetUrl);
    return await sendEmail(email, template.subject, template.html);
};

/**
 * Send event invitation email
 */
export const sendEventInvitationEmail = async (email, name, eventName, eventUrl, venueName) => {
    const template = templates.eventInvitation(name, eventName, eventUrl, venueName);
    return await sendEmail(email, template.subject, template.html);
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmedEmail = async (email, name, eventName, eventUrl) => {
    const template = templates.bookingConfirmed(name, eventName, eventUrl);
    return await sendEmail(email, template.subject, template.html);
};

/**
 * Send new message notification email
 */
export const sendNewMessageEmail = async (email, name, senderName, messageUrl) => {
    const template = templates.newMessage(name, senderName, messageUrl);
    return await sendEmail(email, template.subject, template.html);
};

export default {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendEventInvitationEmail,
    sendBookingConfirmedEmail,
    sendNewMessageEmail,
};
