import { useEffect, useState } from 'react';

/**
 * Tiny hash router. Routes look like `#/level/1`, `#/lesson/tokenization`, `#/lab/lab-3`.
 * Hash routing means every deep link works on GitHub Pages and Vercel with no server config.
 */
export function getPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

export function useHashPath(): string {
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const onChange = () => setPath(getPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export function navigate(path: string): void {
  if (getPath() === path) return;
  window.location.hash = path;
}

export type Route =
  | { name: 'dashboard' }
  | { name: 'level'; levelId: number }
  | { name: 'lesson'; lessonId: string }
  | { name: 'lab'; labId: string }
  | { name: 'glossary' }
  | { name: 'notfound' };

export function parseRoute(path: string): Route {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'level' && parts[1] !== undefined && /^\d+$/.test(parts[1])) return { name: 'level', levelId: Number(parts[1]) };
  if (parts[0] === 'lesson' && parts[1]) return { name: 'lesson', lessonId: parts[1] };
  if (parts[0] === 'lab' && parts[1]) return { name: 'lab', labId: parts[1] };
  if (parts[0] === 'glossary') return { name: 'glossary' };
  return { name: 'notfound' };
}

export const hrefs = {
  dashboard: () => '#/',
  level: (id: number) => `#/level/${id}`,
  lesson: (id: string) => `#/lesson/${id}`,
  lab: (id: string) => `#/lab/${id}`,
  glossary: () => '#/glossary',
};
