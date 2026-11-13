import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Search, X, FileStack, GraduationCap, FlaskConical, ArrowRight } from 'lucide-react';
import { GLOSSARY, CHEAT_SHEET } from '../data/glossary';
import { ALL_LABS, ALL_LESSONS, LEVELS } from '../data/curriculum';
import { hrefs } from '../lib/router';
import { cx } from './ui';

interface GlossaryCtx {
  open: (query?: string, tab?: 'glossary' | 'cheat') => void;
}
const Ctx = createContext<GlossaryCtx>({ open: () => undefined });
export const useGlossary = () => useContext(Ctx);

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'glossary' | 'cheat'>('glossary');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') setOpen(false);
      else if (e.key === '/' && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const api = useMemo<GlossaryCtx>(
    () => ({
      open: (q = '', t = 'glossary') => {
        setQuery(q);
        setTab(t);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {isOpen && <GlossaryModal query={query} setQuery={setQuery} tab={tab} setTab={setTab} onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

function GlossaryModal({
  query,
  setQuery,
  tab,
  setTab,
  onClose,
}: {
  query: string;
  setQuery: (q: string) => void;
  tab: 'glossary' | 'cheat';
  setTab: (t: 'glossary' | 'cheat') => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), [tab]);

  const q = query.trim().toLowerCase();
  const terms = GLOSSARY.filter((g) => !q || g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q) || g.aka?.toLowerCase().includes(q)).sort((a, b) => {
    if (!q) return a.level - b.level;
    const as = a.term.toLowerCase().startsWith(q) ? 0 : a.term.toLowerCase().includes(q) ? 1 : 2;
    const bs = b.term.toLowerCase().startsWith(q) ? 0 : b.term.toLowerCase().includes(q) ? 1 : 2;
    return as - bs;
  });
  const lessons = q ? ALL_LESSONS.filter((l) => l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q)).slice(0, 5) : [];
  const labs = q ? ALL_LABS.filter((l) => l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)).slice(0, 4) : [];
  const cheat = CHEAT_SHEET.map((s) => ({ ...s, items: s.items.filter((i) => !q || i.k.toLowerCase().includes(q) || i.v.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)) })).filter(
    (s) => s.items.length > 0,
  );

  const go = (href: string) => {
    window.location.hash = href.replace(/^#/, '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-3 pt-[6vh] backdrop-blur-sm" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Glossary and cheat sheet">
      <div className="flex max-h-[86vh] w-full max-w-3xl animate-pop flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <Search className="ml-1 h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms, cheat sheet, lessons and labs…  (e.g. “RAG”, “TTFT”, “DPDP”)"
            className="flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-slate-200 px-3 pt-2 dark:border-slate-800">
          {(
            [
              ['glossary', 'Quick Glossary', BookOpen],
              ['cheat', 'AI PM Cheat Sheet', FileStack],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              onClick={() => setTab(id)}
              className={cx(
                'flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium',
                tab === id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
          {(lessons.length > 0 || labs.length > 0) && (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {lessons.map((l) => (
                <button type="button" key={l.id} onClick={() => go(hrefs.lesson(l.id))} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-sm hover:border-indigo-400 dark:border-slate-700">
                  <GraduationCap className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="flex-1 truncate">
                    <span className="text-xs text-slate-500">Lesson · L{l.levelId}</span> <span className="font-medium">{l.title}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
              {labs.map((l) => (
                <button type="button" key={l.id} onClick={() => go(hrefs.lab(l.id))} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-sm hover:border-indigo-400 dark:border-slate-700">
                  <FlaskConical className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="flex-1 truncate">
                    <span className="text-xs text-slate-500">{l.code}</span> <span className="font-medium">{l.title}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
          {tab === 'glossary' ? (
            terms.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No terms match “{query}”. Try the cheat sheet tab.</p>
            ) : (
              <dl className="space-y-2">
                {terms.map((g) => (
                  <div key={g.term} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <dt className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {g.term}
                        {g.aka && <span className="ml-1.5 text-xs font-normal text-slate-500">({g.aka})</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">L{g.level} · {LEVELS[g.level]?.title.split(' ').slice(0, 3).join(' ')}</span>
                        {g.lesson && (
                          <button type="button" onClick={() => go(hrefs.lesson(g.lesson!))} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                            Open lesson →
                          </button>
                        )}
                      </span>
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{g.def}</dd>
                  </div>
                ))}
              </dl>
            )
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {cheat.map((s) => (
                <div key={s.title} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">{s.title}</div>
                  <ul className="space-y-1.5">
                    {s.items.map((i) => (
                      <li key={i.k} className="text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{i.k}: </span>
                        <span className="text-slate-600 dark:text-slate-300">{i.v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {cheat.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nothing in the cheat sheet matches “{query}”.</p>}
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800">
          <kbd className="rounded border px-1">Ctrl/⌘ K</kbd> or <kbd className="rounded border px-1">/</kbd> to open anywhere · <kbd className="rounded border px-1">Esc</kbd> to close · {GLOSSARY.length} terms
        </div>
      </div>
    </div>
  );
}
