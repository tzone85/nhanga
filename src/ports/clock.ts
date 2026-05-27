export interface Clock { now(): Date }
export const fixedClock = (d: Date): Clock => ({ now: () => new Date(d) });
