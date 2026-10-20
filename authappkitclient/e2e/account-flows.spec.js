import { test, expect } from '@playwright/test';
import { mockApi, requestsTo, VALID_PASSWORD } from './helpers/mock-api.js';

test.describe('profile', () => {
  test('saves a changed name and bio', async ({ page }) => {
    const api = await mockApi(page, { loggedIn: true });
    await page.goto('/profile');

    await page.getByLabel('Name').fill('Sam Updated');
    await page.getByLabel('Bio').fill('Builds things.');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Your profile has been saved.')).toBeVisible();
    expect(requestsTo(api, 'PATCH /api/profile')[0].body).toEqual({
      name: 'Sam Updated',
      bio: 'Builds things.',
    });
  });
});

test.describe('security settings', () => {
  test('marks this device and lets the user log out another one', async ({ page }) => {
    const api = await mockApi(page, { loggedIn: true });
    await page.goto('/security');

    await expect(page.getByText('This device')).toBeVisible();
    await expect(page.getByText('Firefox on Linux')).toBeVisible();

    // The header also has a "Log out" button, so look inside the device list only.
    await page.getByRole('list').getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByText('That device has been logged out.')).toBeVisible();
    await expect(page.getByText('Firefox on Linux')).toHaveCount(0);
    expect(requestsTo(api, 'POST /api/auth/revoke-session')[0].body).toEqual({ token: 'token-2' });
  });

  test('logs out all other devices but keeps this one', async ({ page }) => {
    await mockApi(page, { loggedIn: true });
    await page.goto('/security');

    await page.getByRole('button', { name: 'Log out all other devices' }).click();

    await expect(page.getByText('All your other devices have been logged out.')).toBeVisible();
    await expect(page.getByText('This device')).toBeVisible();
    await expect(page.getByText('Firefox on Linux')).toHaveCount(0);
  });

  test('changes the password', async ({ page }) => {
    const api = await mockApi(page, { loggedIn: true });
    await page.goto('/security');

    await page.getByLabel('Current password').fill(VALID_PASSWORD);
    await page.getByLabel('New password', { exact: true }).fill('a-brand-new-password-2');
    await page.getByLabel('Confirm new password').fill('a-brand-new-password-2');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByText('Your password has been changed.')).toBeVisible();
    expect(requestsTo(api, 'POST /api/auth/change-password')[0].body).toMatchObject({
      currentPassword: VALID_PASSWORD,
      revokeOtherSessions: true,
    });
  });

  test('deletes the account only after the confirmation word is typed', async ({ page }) => {
    const api = await mockApi(page, { loggedIn: true });
    await page.goto('/security');
    const deleteButton = page.getByRole('button', { name: 'Delete my account' });

    await expect(deleteButton).toBeDisabled();
    await page.getByLabel(/Type DELETE to confirm/).fill('DELETE');
    await deleteButton.click();

    await expect(page).toHaveURL(/\/$/);
    expect(requestsTo(api, 'DELETE /api/account')[0].body).toEqual({ confirmation: 'DELETE' });
  });
});