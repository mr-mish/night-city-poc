export type FixedStepper = {
  /** Advance by a frame's dt, calling `step` zero or more times. Returns the interpolation alpha in [0,1). */
  advance(frameDt: number, step: (dt: number) => void): number;
};

export function createFixedStepper(stepDt = 1 / 60, maxSubSteps = 5): FixedStepper {
  let acc = 0;
  return {
    advance(frameDt, step) {
      acc += Math.max(0, frameDt);
      let n = 0;
      while (acc >= stepDt && n < maxSubSteps) {
        step(stepDt);
        acc -= stepDt;
        n++;
      }
      if (acc >= stepDt) acc = 0; // spiral-of-death guard: drop the backlog
      return acc / stepDt;
    },
  };
}
