import { test, expect } from '@playwright/test';

// The URL pattern for the session endpoint, which is used to check the user's session status. The '**' wildcard allows matching any path that ends with '/api/auth/get-session'.
const SESSION_URL = '**/api/auth/get-session';
const SESSION_DELAY_MS = 1500;
const CLIENT_ORIGIN = process.env.E2E_CLIENT_URL ?? 'http://localhost:3000';

const verifiedSession = {
  user: { id: 'user-1', name: 'Sam Tester', email: 'sam@example.com', emailVerified: true },
  session: { id: 'session-1', token: 'token-1' },
};

// Waits before answering, which is what a slow network looks like to the page.
async function answerSession(page, { status = 200, body }) {
  await page.route(SESSION_URL, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SESSION_DELAY_MS));
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': CLIENT_ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify(body),
    });
  });
}

function trackNavigations(page) {
  const visited = [];

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname);
  });
  return visited;
}

test.describe('protected routes while the session is loading', () => {
  test('show a skeleton, not the page and not the login screen, until the session is known', async ({
    page,
  }) => {
    await answerSession(page, { body: verifiedSession });
    const visited = trackNavigations(page);

    await page.goto('/dashboard');

    await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible();
    await expect(page.getByText('Signed in as')).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/dashboard');

    await expect(page.getByText('Signed in as sam@example.com')).toBeVisible();
    expect(visited).not.toContain('/login');
  });

  test('send a logged-out visitor to /login only after the check has finished', async ({
    page,
  }) => {
    await answerSession(page, { body: null });

    await page.goto('/dashboard');

    await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('do not log anyone out when the session check itself fails', async ({ page }) => {
    await answerSession(page, {
      status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } },
    });

    await page.goto('/dashboard');

    await expect(page.getByText('We could not check your session')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/dashboard');
  });

  test('ask an unverified user to verify their email instead of showing the page', async ({
    page,
  }) => {
    const unverified = {
      ...verifiedSession,
      user: { ...verifiedSession.user, emailVerified: false },
    };
    await answerSession(page, { body: unverified });

    await page.goto('/dashboard');

    await expect(page.getByText('Verify your email')).toBeVisible();
    await expect(page.getByText('Signed in as')).toHaveCount(0);
  });
});
