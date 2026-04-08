import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('hybrid ranking definition', () => {
  it('combina keyword + semantic con boost de prioridad', () => {
    const sql = readFileSync('supabase/migrations/20260408160000_phase4_embeddings_search.sql', 'utf8');
    expect(sql).toContain('0.55 * semantic_score + 0.35 * keyword_score + priority_boost');
    expect(sql).toContain("dv.status = 'approved'");
    expect(sql).toContain('dv.is_current = true');
  });
});
