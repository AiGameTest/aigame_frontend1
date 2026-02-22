export function Vignette() {
  return (
    <>
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[2] animate-vignette-breathe"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 38%, rgba(6,5,4,0.88) 100%)',
        }}
      />
      {/* Scanlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,5,4,0.07) 2px, rgba(6,5,4,0.07) 4px)',
        }}
      />
    </>
  );
}
