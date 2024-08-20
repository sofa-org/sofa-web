import { animation } from '@livelybone/scroll-get';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const scale = window.winScale || 1;

export class Starry {
  canvas?: HTMLCanvasElement;
  offCanvas?: HTMLCanvasElement;
  stars: {
    size: number;
    color: string;
    top: number;
    left: number;
    shadowSize: number;
  }[];

  constructor(
    public container: HTMLElement,
    public starCount = Math.floor(
      ((window.innerHeight * window.innerWidth * 250) / (1920 * 1080)) * scale,
    ),
    public colors = [
      '#f5d76e',
      '#f7ca18',
      '#f4d03f',
      '#ececec',
      '#ecf0f1',
      '#a2ded0',
    ],
  ) {
    if (!this.container) throw new Error(`Invalid container element`);
    // 创建 canvas
    [this.canvas, this.offCanvas] = this.createCanvas();
    // 渲染星星
    this.stars = this.renderStars();
    // 星星转动
    this.animate();
  }

  destroy() {
    if (this.canvas) this.container?.removeChild(this.canvas);
    delete this.canvas;
    this.stars.splice(0, this.starCount);
  }

  private createCanvas() {
    const { width, height } = this.container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', String(width));
    canvas.setAttribute('height', String(height));
    this.container.appendChild(canvas);
    return [canvas, canvas.cloneNode() as HTMLCanvasElement];
  }

  private renderStar(
    ctx: CanvasRenderingContext2D,
    star: (typeof this.stars)[0],
  ) {
    ctx.beginPath();
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = star.shadowSize;
    ctx.fillRect(star.left, star.top, star.size, star.size);
    ctx.fillStyle = star.color;
    ctx.fill();
  }

  private renderStars() {
    if (!this.canvas) return [];
    const { width, height } = this.container.getBoundingClientRect();
    const stars = [...Array(this.starCount)].map(() => {
      const size = (Math.random() * 1.5) / scale;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const top = Math.random() * height * 2 - height * 0.5;
      const left = Math.random() * width * 2 - width * 0.5;
      const shadowSize = (Math.random() * 10) / scale;
      return { size, color, top, left, shadowSize };
    });
    const ctx = this.offCanvas!.getContext('2d')!;
    stars.forEach((it) => {
      this.renderStar(ctx, it);
    });
    this.canvas!.getContext('2d')!.clearRect(0, 0, width, height);
    this.canvas!.getContext('2d')!.drawImage(this.offCanvas!, 0, 0);
    return stars;
  }

  private animate() {
    if (!this.canvas) return;
    const { width, height } = this.container.getBoundingClientRect();
    const nextState = [...Array(this.starCount)].map(() => {
      return {
        top: Math.random() * height * 2 - height * 0.5,
        left: Math.random() * width * 2 - width * 0.5,
        shadowSize: (Math.random() * 10) / scale,
        lightCycleTime: (Math.floor(Math.random() * 5) + 1) * 1000,
      };
    });
    animation(
      200000,
      (r) => {
        if (!this.canvas || !this.offCanvas) return;
        const ctx = this.offCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, width, height);
        this.stars.forEach((it, i) => {
          const star = {
            ...it,
            shadowSize:
              it.shadowSize + r * (nextState[i].shadowSize - it.shadowSize),
            left: it.left + r * (nextState[i].left - it.left),
            top: it.top + r * (nextState[i].top - it.top),
          };
          const time = (r * 200000) % nextState[i].lightCycleTime;
          const count =
            1 + 3 * Math.abs(1 - (time / nextState[i].lightCycleTime) * 2);
          for (let i = 0; i < count; i += 1) {
            this.renderStar(ctx, star);
          }
        });

        this.canvas!.getContext('2d')!.clearRect(0, 0, width, height);
        this.canvas!.getContext('2d')!.drawImage(this.offCanvas!, 0, 0);
      },
      (r) => r,
    ).then(() => {
      this.stars.forEach((it, i) => {
        Object.assign(it, nextState[i]);
      });
      this.animate();
    });
  }
}
