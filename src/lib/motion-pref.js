// Shared motion preference. Every animated module checks this before animating.
const mq = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => mq.matches;
export const finePointer = () => matchMedia('(pointer: fine)').matches;
