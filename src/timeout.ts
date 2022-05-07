export type TimeStart = number;

export interface ITimeout {
  getStart: () => TimeStart,
  hasExpired: (start: TimeStart) => boolean,
}

const defaultNow = (): number => new Date().getTime();

export function make(
  timeoutMillis: number,
  injectedNow?: () => number,
): ITimeout {
  const now = injectedNow == null ? defaultNow : injectedNow;

  return {
    getStart(): TimeStart {
      return new Date().getTime();
    },

    hasExpired(start: TimeStart): boolean {
      return (now() - start) >= timeoutMillis;
    },
  };
}
