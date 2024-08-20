// 参考：https://github.com/codrops/codrops-sketches/blob/main/015-custom-cursor-filter-3/index.html
import { useEffect, useRef } from 'react';
import { useDomChange, useLazyCallback } from '@sofa/utils/hooks';
import gsap from 'gsap';

import { lerp } from '../utils';

import './index.scss';

// Track the cursor position
const cursor = { x: 0, y: 0, out: false };
window.addEventListener('mousemove', (ev) => {
  cursor.x = ev.clientX;
  cursor.y = ev.clientY;
});
document.addEventListener('mouseenter', () => (cursor.out = false));
document.addEventListener('mouseleave', () => (cursor.out = true));

/**
 * Class representing a custom cursor.
 * A Cursor can have multiple elements/svgs
 */
class Cursor {
  // DOM elements
  DOM = {
    // cursor elements (SVGs .cursor)
    elements: null as null | HTMLElement[] | NodeListOf<HTMLElement>,
  };
  // All CursorElement instances
  cursorElements: CursorElement[] = [];

  /**
   * Constructor.
   * @param {NodeList} Dom_elems - all .cursor elements
   * @param {String} triggerSelector - Trigger the cursor enter/leave method on the this selector returned elements. Default is all <a>.
   */
  constructor(
    Dom_elems: HTMLElement[] | NodeListOf<HTMLElement>,
    public triggerSelector = 'a',
  ) {
    this.DOM.elements = Dom_elems;

    [...this.DOM.elements].forEach((el) =>
      this.cursorElements.push(new CursorElement(el)),
    );

    this.detectTriggers();
  }

  detectTriggers() {
    [...document.querySelectorAll(this.triggerSelector)].forEach((link) => {
      link.removeEventListener('mouseenter', this.enter);
      link.removeEventListener('mouseleave', this.leave);
      link.addEventListener('mouseenter', this.enter);
      link.addEventListener('mouseleave', this.leave);
    });
  }

  /**
   * Mouseenter event
   */
  enter = () => {
    for (const el of this.cursorElements) {
      el.enter();
    }
  };

  /**
   * Mouseleave event
   */
  leave = () => {
    for (const el of this.cursorElements) {
      el.leave();
    }
  };

  destroy() {
    this.DOM = { elements: null };
    this.cursorElements.forEach((it) => it.destroy());
    this.cursorElements = [];
    [...document.querySelectorAll(this.triggerSelector)].forEach((link) => {
      link.removeEventListener('mouseenter', this.enter);
      link.removeEventListener('mouseleave', this.leave);
    });
  }
}

/**
 * Class representing a .cursor element
 */
class CursorElement {
  // DOM elements
  DOM = {
    // Main element (.cursor)
    el: null as null | HTMLElement,
    // Inner element (.cursor-inner)
    inner: null as null | HTMLElement,
    // feTurbulence element
    feTurbulence: null as null | HTMLElement,
  };
  opacity = 1;
  // Scales value when entering an <a> element
  radiusOnEnter = 40;
  // Opacity value when entering an <a> element
  opacityOnEnter = 1;
  // radius
  radius = 20;
  // Element style properties
  renderedStyles = {
    // With interpolation, we can achieve a smooth animation effect when moving the cursor.
    // The "previous" and "current" values are the values that will interpolate.
    // The returned value will be one between these two (previous and current) at a specific increment.
    // The "amt" is the amount to interpolate.
    // As an example, the following formula calculates the x-axis translation value to apply to the cursor element:
    // this.renderedStyles.tx.previous = lerp(this.renderedStyles.tx.previous, this.renderedStyles.tx.current, this.renderedStyles.tx.amt);

    // translation, scale and opacity values
    // The lower the amt, the slower the cursor "follows" the user gesture
    tx: { previous: 0, current: 0, amt: 0.15 },
    ty: { previous: 0, current: 0, amt: 0.15 },
    // The scale and opacity will change when hovering over any element specified in [triggerSelector]
    // Defaults are 1 for both properties
    //scale: {previous: 1, current: 1, amt: 0.2},
    radius: { previous: 20, current: 20, amt: 0.15 },
    opacity: { previous: 1, current: 1, amt: 0.15 },
  };
  // Element size and position
  bounds;
  // SVG filter id
  filterId = '#cursor-filter';
  // for the filter animation
  primitiveValues = { turbulence: 0 };
  filterTimeline?: ReturnType<gsap.core.Timeline['to']>;
  destroyed?: boolean;

  /**
   * Constructor.
   */
  constructor(DOM_el: HTMLElement) {
    this.DOM.el = DOM_el;
    this.DOM.inner = this.DOM.el.querySelector('.cursor-inner');
    this.DOM.feTurbulence = document.querySelector(
      `${this.filterId} > feTurbulence`,
    );

    this.createFilterTimeline();

    // Hide it initially
    this.opacity = 0;
    this.DOM.el.style.opacity = '0';

    // Calculate size and position
    this.bounds = this.DOM.el.getBoundingClientRect();

    // Check if any options passed in data attributes
    this.radiusOnEnter =
      Number(this.DOM.el.dataset.radiusEnter) || this.radiusOnEnter;
    this.opacityOnEnter =
      Number(this.DOM.el.dataset.opacityEnter) || this.opacityOnEnter;
    for (const $key in this.renderedStyles) {
      const key = $key as keyof typeof this.renderedStyles;
      this.renderedStyles[key].amt =
        Number(this.DOM.el.dataset.amt) || this.renderedStyles[key].amt;
    }

    this.radius = Number(this.DOM.inner?.getAttribute('r')) || 20;
    this.renderedStyles['radius'].previous = this.renderedStyles[
      'radius'
    ].current = this.radius;
    this.renderedStyles['opacity'].previous = this.renderedStyles[
      'opacity'
    ].current = this.opacity;

    // Show the element and start tracking its position as soon as the user moves the cursor.
    const onMouseMoveEv = () => {
      // Set up the initial values to be the same
      this.renderedStyles.tx.previous = this.renderedStyles.tx.current =
        cursor.x - this.bounds.width / 2;
      this.renderedStyles.ty.previous = this.renderedStyles.ty.previous =
        cursor.y - this.bounds.height / 2;
      // Show it
      this.DOM.el!.style.opacity = String(this.opacity);
      // Start rAF loop
      requestAnimationFrame(() => this.render());
      // Remove the initial mousemove event
      window.removeEventListener('mousemove', onMouseMoveEv);
    };
    window.addEventListener('mousemove', onMouseMoveEv);
  }

  destroy() {
    this.destroyed = true;
  }

  /**
   * Mouseenter event
   * Scale up and fade out.
   */
  enter() {
    this.renderedStyles['radius'].current = this.radiusOnEnter;
    this.renderedStyles['opacity'].current = this.opacityOnEnter;

    this.filterTimeline?.restart();
  }

  /**
   * Mouseleave event
   * Reset scale and opacity.
   */
  leave() {
    this.renderedStyles['radius'].current = this.radius;
    this.renderedStyles['opacity'].current = this.opacity;

    this.filterTimeline?.progress(1).kill();
  }

  createFilterTimeline() {
    this.filterTimeline = gsap
      .timeline({
        paused: true,
        onStart: () => {
          this.DOM.inner!.style.filter = `url(${this.filterId}`;
        },
        onUpdate: () => {
          this.DOM.feTurbulence!.setAttribute(
            'baseFrequency',
            String(this.primitiveValues.turbulence),
          );
        },
        onComplete: () => {
          this.DOM.inner!.style.filter = 'none';
        },
      })
      .to(this.primitiveValues, {
        duration: 0.5,
        ease: 'sine.in',
        startAt: { turbulence: 1 },
        turbulence: 0,
      });
  }

  /**
   * Loop / Interpolation
   */
  render() {
    if (this.destroyed) return;
    // New cursor positions
    this.renderedStyles['tx'].current = cursor.x - this.bounds.width / 2;
    this.renderedStyles['ty'].current = cursor.y - this.bounds.height / 2;

    // Apply interpolated values (smooth effect)
    if (
      this.filterTimeline?.isActive() ||
      Date.now() - Number(this.filterTimeline?.endTime()) > 2000
    ) {
      // Interpolation
      for (const $key in this.renderedStyles) {
        const key = $key as keyof typeof this.renderedStyles;
        this.renderedStyles[key].previous = lerp(
          this.renderedStyles[key].previous,
          this.renderedStyles[key].current,
          this.renderedStyles[key].amt,
        );
      }

      this.DOM.el!.style.transform = `translateX(${this.renderedStyles['tx'].previous}px) translateY(${this.renderedStyles['ty'].previous}px)`;
      this.DOM.inner!.setAttribute(
        'r',
        String(this.renderedStyles['radius'].previous),
      );
      this.DOM.el!.style.opacity = cursor.out
        ? '0'
        : String(this.renderedStyles['opacity'].previous);
    }

    // loop...
    requestAnimationFrame(() => this.render());
  }
}

const cursors = [
  { opacity: 0.7, dataSet: { 'data-amt': '0.13' }, color: '#c96b9c' },
  { opacity: 0.6, dataSet: { 'data-amt': '0.115' }, color: '#cd685f' },
  { opacity: 0.5, dataSet: { 'data-amt': '0.1' }, color: '#d4743f' },
  { opacity: 0.4, dataSet: { 'data-amt': '0.085' }, color: '#f1d561' },
  { opacity: 0.3, dataSet: { 'data-amt': '0.07' }, color: '#90bd6d' },
  { opacity: 0.2, dataSet: { 'data-amt': '0.055' }, color: '#559d86' },
  { opacity: 0.1, dataSet: { 'data-amt': '0.04' }, color: '#3f6fb3' },
];

export const CursorTail = () => {
  const ref = useRef<Cursor>();

  useEffect(() => {
    setTimeout(() => {
      ref.current?.destroy();
      ref.current = new Cursor(
        document.querySelectorAll('.cursor'),
        '.cursor-tail-particle',
      );
    });
  }, []);

  useDomChange(
    () => ref.current?.detectTriggers(),
    () => document.body,
  );

  return (
    <div className="cursor-tail">
      <svg className="cursor" width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <filter
            id="cursor-filter"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0"
              numOctaves="1"
              result="warp"
            />
            <feDisplacementMap
              xChannelSelector="R"
              yChannelSelector="G"
              scale="30"
              in="SourceGraphic"
            />
          </filter>
        </defs>
        <circle className="cursor-inner" cx="50" cy="50" r="15" />
      </svg>
      {cursors.map((it) => (
        <svg
          key={it.opacity}
          className="cursor"
          style={{ opacity: it.opacity, color: it.color }}
          width="100"
          height="100"
          viewBox="0 0 100 100"
          {...it.dataSet}
        >
          <circle className="cursor-inner" cx="50" cy="50" r="15" />
        </svg>
      ))}
    </div>
  );
};
