import type { RemoteService, RemoteServiceClient } from './services/remoteService.js';
import type { Service, ServiceClient } from './services/service.js';
import {
  _BRAND_REMOTE_SERVICE_,
  _BRAND_REMOTE_SERVICE_CLIENT,
  _BRAND_SERVICE_,
  _BRAND_SERVICE_CLIENT_,
} from './core/internal/symbols.js';

function is<T>(x: unknown, verify: (x: T) => boolean): x is T {
  return x != null && verify(x as T);
}

export function isService(x: unknown): x is Service<any> {
  return is<Service<any>>(x, (x) => x[_BRAND_SERVICE_]);
}
export function isRemoteService(x: unknown): x is RemoteService<any> {
  return is<RemoteService<any>>(x, (x) => x[_BRAND_REMOTE_SERVICE_]);
}

export function isServiceClient(x: unknown): x is ServiceClient<any> {
  return is<ServiceClient<any>>(x, (x) => x[_BRAND_SERVICE_CLIENT_]);
}
export function isRemoteServiceClient(x: unknown): x is RemoteServiceClient<any> {
  return is<RemoteServiceClient<any>>(x, (x) => x[_BRAND_REMOTE_SERVICE_CLIENT]);
}
