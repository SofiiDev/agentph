import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('frontend boundary', () => {
  it('frontend no importa módulos server-only', () => {
    const page = readFileSync('src/app/page.tsx', 'utf-8');
    const login = readFileSync('src/components/login-placeholder.tsx', 'utf-8');
    const dashboard = readFileSync('src/components/dashboard-placeholder.tsx', 'utf-8');
    const all = `${page}\n${login}\n${dashboard}`;

    expect(all.includes("@/server/")).toBe(false);
  });
});
