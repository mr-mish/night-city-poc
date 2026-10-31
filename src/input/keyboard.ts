export type InputState = {
  /** Screen-right (+1) / left (−1). */
  moveX: number;
  /** Screen-up (+1) / down (−1). */
  moveY: number;
  run: boolean;
  interact: boolean;
  handbrake: boolean;
};

export const emptyInput = (): InputState => ({ moveX: 0, moveY: 0, run: false, interact: false, handbrake: false });

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE',
]);

export function mapKeys(down: ReadonlySet<string>): InputState {
  const has = (...codes: string[]) => codes.some((c) => down.has(c));
  return {
    moveX: (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0),
    moveY: (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0),
    run: has('ShiftLeft', 'ShiftRight'),
    interact: has('KeyE'),
    handbrake: has('Space'),
  };
}

export class Keyboard {
  private readonly down = new Set<string>();

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.down.add(e.code);
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  read(): InputState {
    return mapKeys(this.down);
  }
}
