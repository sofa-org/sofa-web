/* eslint-disable */
// @ts-nocheck

const { PI, cos, sin, abs, sqrt, pow, round, random, atan2 } = Math;
const HALF_PI = 0.5 * PI;
const TAU = 2 * PI;
const TO_RAD = PI / 180;
const floor = (n) => n | 0;
const rand = (n) => n * random();
const randIn = (min, max) => rand(max - min) + min;
const randRange = (n) => n - rand(2 * n);
const fadeIn = (t, m) => t / m;
const fadeOut = (t, m) => (m - t) / m;
const fadeInOut = (t, m) => {
  let hm = 0.5 * m;
  return abs(((t + hm) % m) - hm) / hm;
};
const dist = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
const angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1);
const lerp = (n1, n2, speed) => (1 - speed) * n1 + speed * n2;

export function pipeline(domId) {
  const pipeCount = 30;
  const pipePropCount = 8;
  const pipePropsLength = pipeCount * pipePropCount;
  const turnCount = 8;
  const turnAmount = (360 / turnCount) * TO_RAD;
  const turnChanceRange = 100;
  const baseSpeed = 0.5;
  const rangeSpeed = 1;
  const baseTTL = 100;
  const rangeTTL = 300;
  const baseWidth = 2;
  const rangeWidth = 4;
  // const baseHue = 180;
  // const rangeHue = 60;
  const rangeHues = [327, 17, 49, 150, 212]
  const backgroundColor = 'transparent';

  let container;
  let canvas;
  let ctx;
  let center;
  let tick;
  let pipeProps;
  let destroy;

  function setup() {
    createCanvas();
    resize();
    initPipes();
    draw();
  }

  function initPipes() {
    pipeProps = new Float32Array(pipePropsLength);

    let i;

    for (i = 0; i < pipePropsLength; i += pipePropCount) {
      initPipe(i);
    }
  }

  function initPipe(i) {
    let x, y, direction, speed, life, ttl, width, hue;

    x = rand(canvas.a.width);
    y = center[1];
    direction = round(rand(1)) ? HALF_PI : TAU - HALF_PI;
    speed = baseSpeed + rand(rangeSpeed);
    life = 0;
    ttl = baseTTL + rand(rangeTTL);
    width = baseWidth + rand(rangeWidth);
    // hue = baseHue + rand(rangeHue);
    hue = rangeHues[i % rangeHues.length];

    pipeProps.set([x, y, direction, speed, life, ttl, width, hue], i);
  }

  function updatePipes() {
    tick++;

    let i;

    for (i = 0; i < pipePropsLength; i += pipePropCount) {
      updatePipe(i);
    }
  }

  function updatePipe(i) {
    let i2 = 1 + i,
      i3 = 2 + i,
      i4 = 3 + i,
      i5 = 4 + i,
      i6 = 5 + i,
      i7 = 6 + i,
      i8 = 7 + i;
    let x, y, direction, speed, life, ttl, width, hue, turnChance, turnBias;

    x = pipeProps[i];
    y = pipeProps[i2];
    direction = pipeProps[i3];
    speed = pipeProps[i4];
    life = pipeProps[i5];
    ttl = pipeProps[i6];
    width = pipeProps[i7];
    hue = pipeProps[i8];

    drawPipe(x, y, life, ttl, width, hue);

    life++;
    x += cos(direction) * speed;
    y += sin(direction) * speed;
    turnChance =
      !(tick % round(rand(turnChanceRange))) &&
      (!(round(x) % 6) || !(round(y) % 6));
    turnBias = round(rand(1)) ? -1 : 1;
    direction += turnChance ? turnAmount * turnBias : 0;

    pipeProps[i] = x;
    pipeProps[i2] = y;
    pipeProps[i3] = direction;
    pipeProps[i5] = life;

    checkBounds(x, y);
    life > ttl && initPipe(i);
  }

  function drawPipe(x, y, life, ttl, width, hue) {
    ctx.a.save();
    ctx.a.strokeStyle = `hsla(${hue},75%,50%,${fadeInOut(life, ttl) * 0.125})`;
    ctx.a.beginPath();
    ctx.a.arc(x, y, width, 0, TAU);
    ctx.a.stroke();
    ctx.a.closePath();
    ctx.a.restore();
  }

  function checkBounds(x, y) {
    if (x > canvas.a.width) x = 0;
    if (x < 0) x = canvas.a.width;
    if (y > canvas.a.height) y = 0;
    if (y < 0) y = canvas.a.height;
  }

  function createCanvas() {
    container = document.querySelector('#' + domId);
    canvas = {
      a: document.createElement('canvas'),
      b: document.createElement('canvas'),
    };
    canvas.b.style = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	`;
    container.appendChild(canvas.b);
    ctx = {
      a: canvas.a.getContext('2d'),
      b: canvas.b.getContext('2d'),
    };
    center = [];
    tick = 0;
  }

  function resize() {
    const { innerWidth, innerHeight } = window;

    canvas.a.width = innerWidth;
    canvas.a.height = innerHeight;

    ctx.a.drawImage(canvas.b, 0, 0);

    canvas.b.width = innerWidth;
    canvas.b.height = innerHeight;

    ctx.b.drawImage(canvas.a, 0, 0);

    center[0] = 0.5 * canvas.a.width;
    center[1] = 0.5 * canvas.a.height;
  }

  function render() {
    ctx.b.save();
    ctx.b.fillStyle = backgroundColor;
    ctx.b.clearRect(0, 0, canvas.b.width, canvas.b.height);
    ctx.b.fillRect(0, 0, canvas.b.width, canvas.b.height);
    ctx.b.restore();

    ctx.b.save();
    ctx.b.filter = 'blur(12px)';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();

    ctx.b.save();
    ctx.b.filter = 'opacity(75%)';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
  }

  function draw() {
    const pipeFrames = 666;
    const fadeFrames = 100;
    const t = tick % (pipeFrames + fadeFrames);
    if (t === 0) {
      ctx.a.clearRect(0, 0,  canvas.a.width, canvas.a.height);
      tick += 1;
    } else if (t <= pipeFrames) {
      updatePipes();
    } else {
      ctx.a.save(); // 保存当前状态以便之后恢复
      const delta = fadeFrames - (t - pipeFrames)
      for (let i = 0; i < Math.max(canvas.a.height, canvas.a.width); i += delta) {
        ctx.a.clearRect(0, i, canvas.a.width, 1);
        ctx.a.clearRect(i, 0, 1, canvas.a.height);
      }
      tick += 1;
    }
    render();

    if (!destroy) window.requestAnimationFrame(draw);
  }

  setup();
  window.addEventListener('resize', resize);

  return () => {
    window.removeEventListener('load', setup);
    window.removeEventListener('resize', resize);
    [...container.children].forEach(it => container.removeChild(it));
    destroy = true;
  }
}
