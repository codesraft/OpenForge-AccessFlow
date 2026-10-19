import { describe, it, expect } from 'vitest';
import { fitWithin } from '@/utils/resize-image';

describe('fitWithin', () => {
  it('shrinks a large landscape photo and keeps its proportions', () => {
    expect(fitWithin(4000, 3000, 512)).toEqual({ width: 512, height: 384 });
  });

  it('shrinks a large portrait photo by its height', () => {
    expect(fitWithin(3000, 4000, 512)).toEqual({ width: 384, height: 512 });
  });

  it('never enlarges a small image', () => {
    expect(fitWithin(200, 100, 512)).toEqual({ width: 200, height: 100 });
  });
});