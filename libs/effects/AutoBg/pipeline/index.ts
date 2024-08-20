/* eslint-disable @typescript-eslint/ban-ts-comment */

export class Pipeline {
  destroy: () => void;
  constructor(public container: HTMLElement) {
    // @ts-ignore
    const remover = import('./pipeline').then(({ pipeline }) =>
      pipeline(container.id),
    );
    this.destroy = () => {
      remover.then((cb) => cb());
    };
  }
}
