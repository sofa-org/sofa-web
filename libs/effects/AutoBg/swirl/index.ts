/* eslint-disable @typescript-eslint/ban-ts-comment */

export class Swirl {
  destroy: () => void;
  constructor(public container: HTMLElement) {
    // @ts-ignore
    const remover = import('./swirl').then(({ swirl }) => swirl(container.id));
    this.destroy = () => {
      remover.then((cb) => cb());
    };
  }
}
