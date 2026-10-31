import { describe, expect, it } from 'vitest';
import { MODE_DEFINITIONS } from '../src/types';

describe('application foundation', () => {
  it('exposes the three user-facing extraction modes', () => {
    expect(MODE_DEFINITIONS.map(({ id }) => id)).toEqual(['natural', 'graphic', 'balanced']);
  });
});
