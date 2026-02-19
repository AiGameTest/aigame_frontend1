import { CSSProperties, useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  cropX: number;
  cropY: number;
  cropWidth: number;
  className?: string;
}

export function CroppedThumbnail({ src, alt, cropX, cropY, cropWidth, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgStyle, setImgStyle] = useState<CSSProperties>({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  });

  function recalc(img: HTMLImageElement) {
    const container = containerRef.current;
    if (!container) return;

    const cw = container.offsetWidth;
    if (cw <= 0 || !img.naturalWidth || !img.naturalHeight || cropWidth <= 0) return;

    const scale = 1 / cropWidth;
    const dw = cw * scale;
    const dh = dw * (img.naturalHeight / img.naturalWidth);

    setImgStyle({
      position: 'absolute',
      width: dw,
      height: dh,
      left: -(cropX * dw),
      top: -(cropY * dh),
    });
  }

  useEffect(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const run = () => recalc(img);
    run();

    if (!img.complete) {
      img.addEventListener('load', run);
    }
    const ro = new ResizeObserver(run);
    ro.observe(container);
    window.addEventListener('resize', run);

    return () => {
      img.removeEventListener('load', run);
      ro.disconnect();
      window.removeEventListener('resize', run);
    };
  }, [src, cropX, cropY, cropWidth]);

  return (
    <div ref={containerRef} className={className ?? 'absolute inset-0 overflow-hidden'}>
      <img ref={imgRef} src={src} alt={alt} style={imgStyle} />
    </div>
  );
}
