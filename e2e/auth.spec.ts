import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow users to sign up', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Fill in signup form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to organization setup
    await expect(page).toHaveURL('/auth/setup');
  });

  test('should allow users to log in', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });
});