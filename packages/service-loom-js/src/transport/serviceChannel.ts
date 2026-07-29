import { EventEmitter } from '../events/eventEmitter.js';
import type { ServiceChannelParams } from './types.js';

export type ServiceChannelEvents = {
  connected: () => void;
  disconnected: (reason?: string) => void;
  data: (data: object) => void;
  error: (err: unknown) => void;
};

export abstract class ServiceChannel extends EventEmitter<ServiceChannelEvents> {
  readonly version: number;
  readonly compatibleVersion: number;

  constructor(params?: ServiceChannelParams) {
    super();
    const _params = {
      ...{
        version: 0,
        compatibleVersion: 0,
      },
      ...params,
    };

    const { version, compatibleVersion } = _params;
    this.version = version;
    this.compatibleVersion = compatibleVersion;
  }

  //-- abstracts :

  abstract connect(): Promise<void> | void;
  abstract close(): Promise<void> | void;
  abstract send(data: object): void;
}
