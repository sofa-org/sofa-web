import { CSSProperties } from 'react';

/**
 * Format a text, into normal style and hightlighted sections, append different classNames to each sections.
 * @param txt text, in format of "Normal text, [[Highlighted text]]"
 * @param ops Options
 * @returns span[]
 */
export function formatHighlightedText(
  txt: string,
  ops: {
    hightlightedClassName?: string;
    normalClassName?: string;
    hightlightedStyle?: CSSProperties;
    normalStyle?: CSSProperties;
    turnLineBreakToBR?: boolean;
    createElement?: (
      highlighted: boolean,
      children: JSX.Element[] | string,
      props: { key: string; className?: string; style?: CSSProperties },
    ) => JSX.Element;
  },
) {
  const _create =
    ops.createElement ||
    ((_, children, props) => (
      <span {...props} key={props.key}>
        {children}
      </span>
    ));
  return txt
    .replace(/\[([^[\]]+)\]/g, (_, n) => `__fht__${n}`)
    .split(/\[|\]/)
    .filter(Boolean)
    .map((str, idx) => {
      const highlighted = str.startsWith('__fht__');
      const children = ops.turnLineBreakToBR
        ? str
            .replace(/^__fht__/, '')
            .split(/\r?\n/)
            .map((r, idx) => (
              <>
                {idx > 0 ? <br /> : undefined}
                {r}
              </>
            ))
        : str.replace(/^__fht__/, '');
      return _create(highlighted, children, {
        key: `text-${idx}`,
        style: highlighted ? ops.hightlightedStyle : ops.normalStyle,
        className: highlighted
          ? ops.hightlightedClassName
          : ops.normalClassName,
      });
    });
}
