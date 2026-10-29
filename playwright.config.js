// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Each test gets a new, empty browser context: no profile, no cookies, not logged in anywhere.
module.exports = defineConfig({
    testDir: 'tests',
    fullyParallel: true,
    reporter: [['list']],
    use: { baseURL: 'http://127.0.0.1:4173' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1',
        url: 'http://127.0.0.1:4173/',
        reuseExistingServer: false,
        stderr: 'ignore',
    },
});
