import { defineConfig } from '@playwright/test';
const target = process.env.APP_BASE_URL;
export default defineConfig({
  testDir: './tests', testMatch: ['app.spec.ts', 'journey.spec.ts', 'home-growth.spec.ts', 'rest-events.spec.ts'], timeout: 45000,
  workers: 2,
  use: { baseURL: target || 'http://127.0.0.1:4175', viewport: { width: 1100, height: 1100 }, contextOptions:{reducedMotion:'reduce'}, trace: 'retain-on-failure', video: 'on', screenshot: 'only-on-failure' },
  projects: [{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: target ? undefined : { command: 'npm exec vite preview -- --host 127.0.0.1 --port 4175', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
});
