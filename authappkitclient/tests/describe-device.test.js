import { describe, it, expect } from 'vitest';
import { describeDevice } from '@/utils/describe-device';

describe('describeDevice', () => {
  it('names the browser and the system', () => {
    const chromeOnWindows =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
    const firefoxOnLinux = 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0';

    expect(describeDevice(chromeOnWindows)).toBe('Chrome on Windows');
    expect(describeDevice(firefoxOnLinux)).toBe('Firefox on Linux');
  });

  it('tells Edge and Safari apart from Chrome, which they also mention', () => {
    const edge = 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0';
    const safariOnIphone =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1';

    expect(describeDevice(edge)).toBe('Edge on Windows');
    expect(describeDevice(safariOnIphone)).toBe('Safari on iOS');
  });

  it('copes with a missing or unrecognised User-Agent', () => {
    expect(describeDevice(null)).toBe('Unknown device');
    expect(describeDevice('curl/8.0')).toBe('Unknown browser on unknown system');
  });
});