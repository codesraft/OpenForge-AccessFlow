import { test, expect } from '@playwright/test';
import { mockApi, requestsTo, VALID_PASSWORD } from './helpers/mock-api.js';

test.describe('registration', () => {
  test('asks the new user to check their email', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/register');

    await page.getByLabel('Name').fill('Sam Tester');
    await page.getByLabel('Email').fill('sam@example.com');
    await page.getByLabel('Password', { exact: true }).fill(VALID_PASSWORD);
    await page.getByLabel('Confirm password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('We sent a verification link to')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resend verification email' })).toBeVisible();
    expect(requestsTo(api, 'POST /api/auth/sign-up/email')).toHaveLength(1);
  });

  test('checks the form before calling the server', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/register');

    await page.getByLabel('Name').fill('Sam Tester');
    await page.getByLabel('Email').fill('sam@example.com');
    await page.getByLabel('Password', { exact: true }).fill(VALID_PASSWORD);
    await page.getByLabel('Confirm password').fill('something-different');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    expect(requestsTo(api, 'POST /api/auth/sign-up/email')).toHaveLength(0);
  });
});

test.describe('login and logout', () => {
  test('logs in and lands on the dashboard', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');

    await page.getByLabel('Email').fill('sam@example.com');
    await page.getByLabel('Password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Signed in as sam@example.com')).toBeVisible();
  });

  test('shows a clear message for a wrong password and stays on the login page', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/login');

    await page.getByLabel('Email').fill('sam@example.com');
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('The email or password is not correct.')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/login');
  });

  test('logs out and returns to the login page', async ({ page }) => {
    const api = await mockApi(page, { loggedIn: true });
    await page.goto('/dashboard');
    await expect(page.getByText('Signed in as sam@example.com')).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(requestsTo(api, 'POST /api/auth/sign-out')).toHaveLength(1);
  });
});

test.describe('password reset and email verification pages', () => {
  test('forgot password gives the same answer for any email', async ({ page }) => {
    await mockApi(page);
    await page.goto('/forgot-password');

    await page.getByLabel('Email').fill('anyone@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(
      page.getByText('If an account exists for that email, we sent a link to reset the password.'),
    ).toBeVisible();
  });

  test('a good verification link says the email is verified', async ({ page }) => {
    await page.goto('/verify-email');

    await expect(page.getByText('Your email is verified. You can log in now.')).toBeVisible();
  });

  test('an expired verification link says so', async ({ page }) => {
    await page.goto('/verify-email?error=token_expired');

    await expect(page.getByText('This verification link is invalid or has expired.')).toBeVisible();
  });
});