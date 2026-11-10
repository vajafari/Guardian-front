import type { TimeZone } from '../types/device';

/** TimeZonesEnumeration raw values (Guardian.Shared.Definition.Core), in enum declaration order. */
export const TIME_ZONE_VALUES: TimeZone[] = [
  -1200, -1100, -1000, -930, -900, -800, -700, -600, -500, -430, -400, -330, -300, -200, -100, 0, 100, 200, 300, 330,
  400, 430, 500, 530, 545, 600, 630, 700, 800, 845, 900, 930, 1000, 1030, 1100, 1130, 1200, 1245, 1300, 1400,
];

export const DEFAULT_TIME_ZONE: TimeZone = 330; // Tehran
