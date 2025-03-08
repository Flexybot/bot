import { test, expect } from '@playwright/test';

test.describe('Chatbot Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new chatbot', async ({ page }) => {
    await page.goto('/dashboard/chatbots/new');
    
    // Fill in chatbot creation form
    await page.fill('input[name="name"]', 'Test Chatbot');
    await page.fill('textarea[name="description"]', 'A test chatbot');
    await page.fill('textarea[name="welcomeMessage"]', 'Hello! How can I help?');
    await page.fill('textarea[name="systemPrompt"]', 'You are a helpful assistant');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to chatbot details
    await expect(page.locator('text=Test Chatbot')).toBeVisible();
  });

  test('should edit chatbot settings', async ({ page }) => {
    await page.goto('/dashboard/chatbots/1');
    
    // Click settings tab
    await page.click('button:has-text("Settings")');
    
    // Update settings
    await page.fill('input[name="name"]', 'Updated Chatbot');
    await page.fill('textarea[name="welcomeMessage"]', 'Updated welcome message');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Should show success message
    await expect(page.locator('text=Settings saved successfully')).toBeVisible();
  });

  test('should delete a chatbot', async ({ page }) => {
    await page.goto('/dashboard/chatbots/1');
    
    // Open actions menu
    await page.click('button[aria-label="Open menu"]');
    
    // Click delete
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Should redirect to chatbots list
    await expect(page).toHaveURL('/dashboard/chatbots');
    await expect(page.locator('text=Chatbot deleted successfully')).toBeVisible();
  });
});