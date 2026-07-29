import { EventEmitter } from '../events/eventEmitter.js';
import type { ServiceChannelParams } from './types.js';

export type ServiceHostEvents<TClient> = {
  connected: () => void;
  disconnected: (reason?: string) => void;
  clientConnected: (client: TClient) => void;
  clientDisconnected: (client: TClient, reason?: string) => void;
  data: (client: TClient, data: object) => void;
  error: (err: unknown) => void;
};

export abstract class ServiceHost<TClient> extends EventEmitter<ServiceHostEvents<TClient>> {
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
  abstract send(client: TClient, data: object): void;
}
