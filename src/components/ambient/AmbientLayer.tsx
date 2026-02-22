import { FilmGrain } from './FilmGrain';
import { Vignette } from './Vignette';

interface AmbientLayerProps {
  grain?: boolean;
  vignette?: boolean;
}

export function AmbientLayer({ grain = true, vignette = true }: AmbientLayerProps) {
  return (
    <>
      {grain && <FilmGrain />}
      {vignette && <Vignette />}
    </>
  );
}
