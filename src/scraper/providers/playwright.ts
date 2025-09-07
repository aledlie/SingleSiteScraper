/**
 * Playwright provider for JavaScript-heavy sites
 * Provides browser automation with anti-detection capabilities
 */

import { BaseScrapeProvider, ScrapingCapabilities, ScrapingOptions, ScrapingResult, ProviderHealthCheck } from './base';

export class PlaywrightProvider extends BaseScrapeProvider {
  name = 'Playwright-Browser';
  
  capabilities: ScrapingCapabilities = {
    supportsJavaScript: true,
    supportsStealth: true,
    isCommercial: false,
    costPerRequest: 0.001, // Minimal compute cost
    maxConcurrency: 5,
    avgResponseTime: 3000,
  };

  private browser: any = null;
  private isPlaywrightAvailable = false;

  constructor() {
    super();
    this.checkPlaywrightAvailability();
  }

  private async checkPlaywrightAvailability() {
    try {
      // Dynamic import to avoid breaking if playwright isn't installed
      const { chromium } = await import('playwright');
      this.isPlaywrightAvailable = true;
      
      // Pre-warm browser for better performance
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        });
      }
    } catch (error) {
      console.warn('Playwright not available:', error);
      this.isPlaywrightAvailable = false;
    }
  }

  async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    if (!this.isPlaywrightAvailable) {
      throw new Error('Playwright is not available. Install with: npm install playwright && npx playwright install');
    }

    const startTime = Date.now();
    const timeout = options?.timeout || 30000;
    let context = null;
    let page = null;

    try {
      // Dynamic import
      const { chromium } = await import('playwright');
      
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        });
      }

      // Create new context with stealth options
      context = await this.browser.newContext({
        userAgent: options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: options?.headers || {},
        ignoreHTTPSErrors: true,
        ...(options?.stealth && {
          // Anti-detection measures
          locale: 'en-US',
          timezoneId: 'America/New_York',
          permissions: ['geolocation'],
        })
      });

      if (options?.stealth) {
        // Additional stealth measures
        await context.addInitScript(() => {
          // Override webdriver detection
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          
          // Override chrome detection
          (window as any).chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {}
          };

          // Override permissions
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
              Promise.resolve({ state: Notification.permission }) :
              originalQuery(parameters)
          );
        });
      }

      page = await context.newPage();

      // Block resources to improve performance
      if (options?.blockResources) {
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });
      }

      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: options?.waitForNetwork ? 'networkidle' : 'domcontentloaded',
        timeout,
      });

      if (!response) {
        throw new Error('Failed to load page - no response');
      }

      // Wait for specific selector if provided
      if (options?.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Additional wait for JavaScript to render
      await page.waitForTimeout(1000);

      // Get the final HTML
      const html = await page.content();
      const finalUrl = page.url();
      const status = response.status();
      const responseTime = Date.now() - startTime;

      this.updateMetrics(true, responseTime, this.capabilities.costPerRequest);

      return {
        html,
        url: finalUrl,
        status,
        responseTime,
        provider: this.name,
        cost: this.capabilities.costPerRequest,
        metadata: {
          userAgent: options?.userAgent,
          headers: options?.headers,
          finalUrl,
          redirects: 0, // Playwright handles redirects internally
        },
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime, 0);
      
      throw new Error(`Playwright scraping failed: ${(error as Error).message}`);
    } finally {
      // Clean up
      try {
        if (page) await page.close();
        if (context) await context.close();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isPlaywrightAvailable) {
      return false;
    }

    try {
      // Quick health check with a simple page
      const testUrl = 'data:text/html,<html><body>test</body></html>';
      await this.scrape(testUrl, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getHealthStatus(): Promise<ProviderHealthCheck> {
    try {
      const isHealthy = await this.isAvailable();
      
      return {
        ...this.healthCheck,
        isHealthy,
        lastCheck: new Date(),
        message: isHealthy 
          ? 'Browser automation ready' 
          : 'Playwright unavailable - run: npm install playwright && npx playwright install',
      };
    } catch (error) {
      return {
        ...this.healthCheck,
        isHealthy: false,
        lastCheck: new Date(),
        message: `Health check failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        console.warn('Error closing browser:', error);
      }
    }
  }

  /**
   * Get browser info for debugging
   */
  async getBrowserInfo() {
    if (!this.browser) {
      return null;
    }

    try {
      return {
        version: await this.browser.version(),
        contexts: (await this.browser.contexts()).length,
        pages: (await Promise.all(
          (await this.browser.contexts()).map(c => c.pages())
        )).flat().length,
      };
    } catch {
      return null;
    }
  }
}