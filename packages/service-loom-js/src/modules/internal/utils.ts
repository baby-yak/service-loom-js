import type { ModuleDescriptor } from '../types.js';

export function getLongestName(services: ModuleDescriptor | undefined) {
  if (!services) {
    return 0;
  }
  
  return Object.entries(services).reduce(
    (prev, [key, svc]) => Math.max(prev, (svc.name ?? key).length),
    0,
  );
}
