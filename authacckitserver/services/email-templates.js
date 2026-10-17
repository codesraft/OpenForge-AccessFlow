// This file contains the email templates used by the server to send emails to users. The templates are used for verification emails and password reset emails. The templates are built using a common function that takes the subject, name, intro, action label, url, and outro as parameters and returns an object with the subject, text, and html properties.

const APP_NAME = 'AuthAccKit';

// The link and name end up inside HTML, so special characters are escaped first.
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function greetingFor(name) {
  return name ? `Hi ${name},` : 'Hi,';
}

function buildEmail({ subject, name, intro, actionLabel, url, outro }) {
  const greeting = greetingFor(name);

  return {
    subject,
    text: `${greeting}\n\n${intro}\n\n${actionLabel}: ${url}\n\n${outro}`,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(url)}">${escapeHtml(actionLabel)}</a></p>`,
      `<p>${escapeHtml(outro)}</p>`,
    ].join('\n'),
  };
}

export function verificationEmail({ name, url }) {
  return buildEmail({
    subject: `Verify your email for ${APP_NAME}`,
    name,
    intro:
      'Thanks for signing up. Please confirm your email address to finish creating your account.',
    actionLabel: 'Verify email',
    url,
    outro: 'If you did not create an account, you can ignore this email.',
  });
}

export function passwordResetEmail({ name, url }) {
  return buildEmail({
    subject: `Reset your ${APP_NAME} password`,
    name,
    intro:
      'We received a request to reset your password. The link below works once and expires soon.',
    actionLabel: 'Reset password',
    url,
    outro:
      'If you did not ask for this, you can ignore this email and your password will stay the same.',
  });
}