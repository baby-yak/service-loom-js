import { targetIs } from '../utils/utils.js';
import { MARKER_SERVICE, MARKER_SERVICE_CLIENT } from './internal/markers.js';
import type { RawService } from './rawService.js';
import type { ServiceClient } from './serviceClient.js';

export function isService(x: unknown): x is RawService<any, any> {
  return targetIs(x, MARKER_SERVICE);
}

export function isServiceClient(x: unknown): x is ServiceClient<any, any> {
  return targetIs(x, MARKER_SERVICE_CLIENT);
}
