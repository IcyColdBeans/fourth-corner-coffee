// Bean-to-cup story: pinned horizontal scroll on >=768px, plain vertical stack otherwise.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function init() {
  const section = document.getElementById('journey');
  const viewport = section?.querySelector('.journey__viewport');
  const track = section?.querySelector('.journey__track');
  if (!viewport || !track) return;
  const panels = gsap.utils.toArray('.journey__panel', track);
  if (!panels.length) return;
  const fill = section.querySelector('.journey__progress-fill');
  const cup = section.querySelector('.journey__cup-level');
  const ticks = [...section.querySelectorAll('.journey__tick')];

  const mm = gsap.matchMedia();

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned');
    const steps = panels.length - 1;
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    let step = -1;
    const progress = (p) => {
      if (fill) gsap.set(fill, { scaleX: p });
      if (cup) gsap.set(cup, { scaleY: p });
      const i = Math.round(p * steps);
      if (i !== step) { step = i; ticks.forEach((t, j) => t.classList.toggle('is-active', j <= i)); }
    };
    if (cup) gsap.set(cup, { transformOrigin: '50% 100%' });
    progress(0);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      onUpdate() { progress(this.progress()); },
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: 'top top',
        end: () => '+=' + distance(),
        scrub: 1,
        snap: steps ? { snapTo: 1 / steps, duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' } : false,
        invalidateOnRefresh: true,
        refreshPriority: 1, // motion.js creates later-in-page triggers first; measure the pin before them
      },
    });

    const splits = [];
    panels.forEach((panel, i) => {
      const h = panel.querySelector('h3');
      if (h) {
        const split = SplitText.create(h, { type: 'words', mask: 'words' });
        splits.push(split);
        gsap.from(split.words, {
          yPercent: 110, duration: 0.7, ease: 'expo.out', stagger: 0.05,
          // Panel 1 is on screen before the track moves, so it keys off the section instead.
          scrollTrigger: i
            ? { trigger: panel, containerAnimation: tween, start: 'left 65%', toggleActions: 'play none none reverse' }
            : { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' },
        });
      }
      panel.querySelectorAll('[data-parallax]').forEach((el) => {
        const d = (parseFloat(el.dataset.parallax) || 0) * 40;
        gsap.fromTo(el, { x: d }, {
          x: -d, ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
    });

    return () => { splits.forEach((s) => s.revert()); section.classList.remove('is-pinned'); };
  });

  mm.add('(max-width: 767.98px) and (prefers-reduced-motion: no-preference)', () => {
    panels.forEach((panel) => gsap.from(panel.children, {
      opacity: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: panel, start: 'top 85%', once: true },
    }));
  });
}
