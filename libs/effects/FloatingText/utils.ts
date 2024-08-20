import { lerp } from '../utils';

// 不支持弧线 A
export function flattenPathFac(path: string) {
  const parts = path.split(/(\b|\B)(?=[a-zA-Z])/g);
  if (parts.length < 2)
    return Object.assign((r: number) => path, { width: 0, height: 0 });
  const startPoints: [number, number][] = [];
  const startControllers: [number, number][][] = [];
  // 解析顶点的位置和贝塞尔控制器（controller）的位置
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (/^m/i.test(part)) {
      const matchRes = /^m\s*(\d+)\s+(\d+)/i.exec(part);
      if (matchRes) {
        startPoints.push([+matchRes[1], +matchRes[2]]);
        startControllers.push([]);
      }
    } else if (/^q/i.test(part)) {
      const matchRes = /^q\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i.exec(part);
      if (matchRes) {
        startPoints.push([+matchRes[3], +matchRes[4]]);
        startControllers.push([[+matchRes[1], +matchRes[2]]]);
      }
    } else if (/^c/i.test(part)) {
      const matchRes =
        /^c\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i.exec(part);
      if (matchRes) {
        startPoints.push([+matchRes[5], +matchRes[6]]);
        startControllers.push([
          [+matchRes[1], +matchRes[2]],
          [+matchRes[3], +matchRes[4]],
        ]);
      }
    }
  }
  const endY = (startPoints[0][1] + startPoints[startPoints.length - 1][1]) / 2;
  const endPoints: [number, number][] = [];
  const endControllers: [number, number][][] = [];

  // 差值计算最终态顶点的位置和 controllers 的位置
  for (let i = 0; i < startPoints.length; i += 1) {
    endPoints.push([startPoints[i][0], endY]);
    endControllers.push(
      startControllers[i].map((c) => [c[0], endY] as [number, number]),
    );
  }
  return Object.assign(
    (r: number) => {
      // r 表示由初始状态到最终状态的进度，取值范围 0 ~ 1
      let p = '';
      for (let i = 0; i < startPoints.length; i += 1) {
        const startPoint = startPoints[i];
        const endPoint = endPoints[i];
        const currPoint = [
          lerp(startPoint[0], endPoint[0], r),
          lerp(startPoint[1], endPoint[1], r),
        ];
        const currController = startControllers[i].map((startController, j) => {
          const endController = endControllers[i][j];
          return [
            lerp(startController[0], endController[0], r),
            lerp(startController[1], endController[1], r),
          ] as [number, number];
        });
        const name = { 0: 'M', 1: 'Q', 2: 'C' }[currController.length];
        p += `${name} ${currController.flat().join(' ')} ${currPoint.join(
          ' ',
        )} `;
      }
      return p;
    },
    {
      width:
        Math.max(...startPoints.map((it) => it[0])) -
        Math.min(...startPoints.map((it) => it[0])),
      height:
        Math.max(...startPoints.map((it) => it[1])) -
        Math.min(...startPoints.map((it) => it[1])),
    },
  );
}
