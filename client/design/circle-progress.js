import { define, onAttribute, currentNode } from 'https://esm.sh/minicomp'


define('circle-progress', () => {
  const self = currentNode()

  onAttribute('progress', p => {
    self.style.setProperty('--progress', p)
  })

  onAttribute('size', s => {
    const size = s ?? '44'
    self.style.setProperty('--size', `${size}px`)
    self.setAttribute('viewBox', `0 0 ${size} ${size}`)
  })

  return `
    <style>
      :host {
        --progress: 1;
        --size: 44px;
        --color: #ffffff24;
        --half-size: calc(var(--size) / 2);
        --stroke-width: 4px;
        --radius: calc(var(--size) / 2 - var(--stroke-width));
        --circumference: calc(var(--radius) * 2 * pi);
        --dash: calc(var(--progress) * var(--circumference));
      }

      svg {
        width: var(--size);
        height: var(--size);
        transform: rotate(-90deg);

        circle {
          cx: var(--half-size);
          cy: var(--half-size);
          r: var(--radius);
          stroke-width: var(--stroke-width);
          fill: none;
          stroke-linecap: round;
          stroke-dasharray: var(--dash) calc(var(--circumference) - var(--dash));
          transition: stroke-dasharray .2s linear 0s;
          stroke: var(--color);
        }
      }
    </style>
    <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <circle/>
    </svg>
  `
})
