import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  speed?: number;   // ms per character
  pause?: number;   // ms between lines
  loop?: boolean;
}

export function useTypewriter(
  lines: string[],
  { speed = 60, pause = 2400, loop = true }: UseTypewriterOptions = {},
) {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (lines.length === 0) return;
    const current = lines[lineIdx] ?? '';

    if (charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, speed);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (loop || lineIdx < lines.length - 1) {
        setLineIdx((i) => (i + 1) % lines.length);
        setCharIdx(0);
        setDisplayed('');
      }
    }, pause);
    return () => clearTimeout(t);
  }, [charIdx, lineIdx, lines, speed, pause, loop]);

  return displayed;
}
