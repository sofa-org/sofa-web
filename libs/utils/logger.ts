export class Logger {
  static log(msg: string | number, ...args: unknown[]) {
    console.info(
      `${'%c'}${msg}`,
      'padding:4px 6px;line-height:1em;color:#288ff4;background:#ffe3e3;border-radius:2px',
    );
    console.info(...args);
  }
  static info(msg: string | number, ...args: unknown[]) {
    console.info(
      `${'%c'}${msg}`,
      'padding:4px 6px;line-height:1em;color:#20b165;background:#d7fae4;border-radius:2px',
    );
    console.info(...args);
  }
  static warn(msg: string | number, ...args: unknown[]) {
    console.info(
      `${'%c'}${msg}`,
      'padding:4px 6px;line-height:1em;color:#f4ad28;background:#faebd7;border-radius:2px',
    );
    console.warn(...args);
  }
  static error(msg: string | number, ...args: unknown[]) {
    console.info(
      `${'%c'}${msg}`,
      'padding:4px 6px;line-height:1em;color:#eb3c3c;background:#ffe3e3;border-radius:2px',
    );
    console.error(...args);
  }
}
