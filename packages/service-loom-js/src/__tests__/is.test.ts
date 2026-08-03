import { describe, expect, it } from 'vitest';
import { isService, isServiceClient } from '../is.js';
import type { ServiceDescriptor } from '../services/types.js';
import { Service } from '../services/service.js';

type ICounter = ServiceDescriptor;
class CounterService extends Service<ICounter> implements ICounter {
  constructor() {
    super('counter');
  }
}

describe('is()', () => {
  it('is service/client test', () => {
    const nothing = {};
    const service = new CounterService();
    const client = service.client;

    expect(isService(nothing)).toBeFalsy();
    expect(isService(service)).toBeTruthy(); // <-- yes
    expect(isService(client)).toBeFalsy();

    expect(isServiceClient(nothing)).toBeFalsy();
    expect(isServiceClient(service)).toBeFalsy();
    expect(isServiceClient(client)).toBeTruthy(); // <-- yes
  });
});
