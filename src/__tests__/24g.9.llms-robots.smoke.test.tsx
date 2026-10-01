/**
 * SMOKE TEST — onlyjobs-24g.9: llms.txt + robots.txt restructure
 *
 * Verifies both static files exist, are non-empty, and have the top-level
 * structure expected. Full adversarial coverage is in the companion file.
 */

import fs from 'fs';
import path from 'path';

const ROBOTS_PATH = path.resolve(__dirname, '..', '..', 'public', 'robots.txt');
const LLMS_PATH = path.resolve(__dirname, '..', '..', 'public', 'llms.txt');

describe('24g.9 smoke — static files exist and have basic structure', () => {
  describe('robots.txt', () => {
    it('file exists at public/robots.txt', () => {
      expect(fs.existsSync(ROBOTS_PATH)).toBe(true);
    });

    it('is non-empty', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('has a User-agent: * group', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content).toContain('User-agent: *');
    });

    it('has Allow: /', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content).toContain('Allow: /');
    });

    it('has Sitemap line', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content).toContain('Sitemap: https://onlyjobs.app/sitemap.xml');
    });

    it('references OAI-SearchBot', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content).toContain('User-agent: OAI-SearchBot');
    });

    it('references GPTBot', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content).toContain('User-agent: GPTBot');
    });

    it('has /onboarding disallow', () => {
      const content = fs.readFileSync(ROBOTS_PATH, 'utf-8');
      expect(content).toContain('Disallow: /onboarding');
    });
  });

  describe('llms.txt', () => {
    it('file exists at public/llms.txt', () => {
      expect(fs.existsSync(LLMS_PATH)).toBe(true);
    });

    it('is non-empty', () => {
      const content = fs.readFileSync(LLMS_PATH, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('starts with # OnlyJobs', () => {
      const content = fs.readFileSync(LLMS_PATH, 'utf-8');
      expect(content.trimStart()).toMatch(/^# OnlyJobs/);
    });

    it('contains the Citation Format section', () => {
      const content = fs.readFileSync(LLMS_PATH, 'utf-8');
      expect(content).toContain('## Citation Format for AI Systems');
    });

    it('contains Aurora Designs LLP', () => {
      const content = fs.readFileSync(LLMS_PATH, 'utf-8');
      expect(content).toContain('Aurora Designs LLP');
    });

    it('contains onlyjobs.app', () => {
      const content = fs.readFileSync(LLMS_PATH, 'utf-8');
      expect(content).toContain('onlyjobs.app');
    });
  });
});
