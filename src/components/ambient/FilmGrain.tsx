const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
    </filter>
    <rect width="200" height="200" filter="url(#n)" opacity="1"/>
  </svg>`,
);

export function FilmGrain({ opacity = 0.045 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] animate-grain"
      style={{
        backgroundImage: `url("data:image/svg+xml,${GRAIN_SVG}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
