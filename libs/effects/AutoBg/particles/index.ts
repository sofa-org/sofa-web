/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    particlesJS(domId: string, options: any): void;
    pJSDom: any[];
  }
}
export class Particles {
  static options = {
    particles: {
      number: {
        value: 30,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: '#ffffff',
      },
      shape: {
        type: 'circle',
        stroke: {
          width: 0,
          color: '#000000',
        },
        polygon: {
          nb_sides: 5,
        },
        image: {
          src: '',
          width: 100,
          height: 100,
        },
      },
      opacity: {
        value: 0.8,
        random: false,
        anim: {
          enable: false,
          speed: 1,
          opacity_min: 0.1,
          sync: false,
        },
      },
      size: {
        value: 3,
        random: true,
        anim: {
          enable: false,
          speed: 80,
          size_min: 0.1,
          sync: false,
        },
      },
      line_linked: {
        enable: true,
        distance: 300,
        color: '#ffffff',
        opacity: 0.3,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: 'none',
        random: false,
        straight: false,
        out_mode: 'out',
        bounce: false,
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200,
        },
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: {
          enable: true,
          mode: 'repulse',
        },
        onclick: {
          enable: false,
          mode: 'grab',
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 800,
          line_linked: {
            opacity: 1,
          },
        },
        bubble: {
          distance: 800,
          size: 80,
          duration: 2,
          opacity: 8,
          speed: 3,
        },
        repulse: {
          distance: 100,
          duration: 0.4,
        },
        push: {
          particles_nb: 4,
        },
        remove: {
          particles_nb: 2,
        },
      },
    },
    retina_detect: true,
  };

  instance: Promise<any>;

  constructor(public container: HTMLElement) {
    // @ts-ignore
    this.instance = import('./particles').then(() => {
      window.particlesJS(container.id, Particles.options);
      return window.pJSDom[window.pJSDom.length - 1];
    });
  }

  destroy() {
    this.instance.then((instance) => instance.destroypJS());
  }
}
