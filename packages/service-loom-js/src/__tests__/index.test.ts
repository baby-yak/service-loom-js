import { describe, it, expect } from 'vitest';
import * as api from '../index.js';

describe('service-loom-js', () => {
  it('exports the public API', () => {
    expect(typeof api).toBe('object');
  });
});
