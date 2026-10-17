import nodemailer from 'nodemailer';
import { env } from '../utils/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { verificationEmail, passwordResetEmail } from './email-templates.js';

let transporter = null;

// Created on first use and then reused, so we do not reconnect for every email.
function getTransporter() {
  transporter ??= nodemailer.createTransport(env.smtpUrl);
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!env.smtpUrl || !env.emailFrom) {
    logger.error('Email is not configured: set SMTP_URL and EMAIL_FROM.');
    throw new AppError(500, 'EMAIL_SEND_FAILED', 'We could not send the email. Please try again.');
  }

  try {
    await getTransporter().sendMail({ from: env.emailFrom, to, subject, text, html });
  } catch (error) {
    // The provider's error can contain server details, so it only goes to the log.
    logger.error(`Could not send the "${subject}" email:`, error);
    throw new AppError(500, 'EMAIL_SEND_FAILED', 'We could not send the email. Please try again.');
  }
}

export function sendVerificationEmail({ to, name, url }) {
  return sendEmail({ to, ...verificationEmail({ name, url }) });
}

export function sendPasswordResetEmail({ to, name, url }) {
  return sendEmail({ to, ...passwordResetEmail({ name, url }) });
}