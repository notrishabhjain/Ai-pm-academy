import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Search,
  Moon,
  Sun,
  Download,
  Upload,
  ChevronDown,
  CheckCircle2,
  Circle,
  FlaskConical,
  Menu,
  X,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { LEVELS } from '../data/curriculum';
import { COLORS } from '../lib/colors';
import { hrefs, type Route } from '../lib/router';
import { levelProgress, masteryBreakdown } from '../lib/mastery';
import { exportProgress, useProgress } from '../store/progress';
import { useGlossary } from './GlossaryModal';
import { ProgressBar, cx } from './ui';

function currentLevelId(route: Route): number | null {
  if (route.name === 'level') return route.levelId;
  if (route.name === 'lesson') return LEVELS.find((l) => l.lessons.some((x) => x.id === route.lessonId))?.id ?? null;
  if (route.name === 'lab') return LEVELS.find((l) => l.labs.some((x) => x.id === route.labId))?.id ?? null;
  return null;
}

function Sidebar({ route, onNavigate }: { route: Route; onNavigate: () => void }) {
  const { state, importState, setTheme } = useProgress();
  const glossary = useGlossary();
  const activeLevel = currentLevelId(route);
  const [expanded, setExpanded] = useState<number | null>(activeLevel);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const mastery = masteryBreakdown(state);

  useEffect(() => {
    if (activeLevel !== null) setExpanded(activeLevel);
  }, [activeLevel]);

  const activeId = route.name === 'lesson' ? route.lessonId : route.name === 'lab' ? route.labId : null;

  return (
    <div className="flex h-full flex-col">
      <a href={hrefs.dashboard()} onClick={onNavigate} className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">AI PM Academy</span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">Novice → Chief AI PM</span>
        </span>
      </a>

      <div className="space-y-1 px-3">
        <a
          href={hrefs.dashboard()}
          onClick={onNavigate}
          className={cx(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            route.name === 'dashboard' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
          )}
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
          <span className="ml-auto rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">{Math.round(mastery.overall)}%</span>
        </a>
        <button
          type="button"
          onClick={() => {
            glossary.open();
            onNavigate();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <BookOpen className="h-4 w-4" /> Glossary & Cheat Sheet
          <kbd className="ml-auto rounded border border-slate-300 px-1 text-[10px] text-slate-500 dark:border-slate-600">⌘K</kbd>
        </button>
      </div>

      <div className="mt-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Curriculum</div>
      <nav className="scrollbar-thin mt-1 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {LEVELS.map((lv) => {
          const c = COLORS[lv.color];
          const p = levelProgress(lv, state);
          const isOpen = expanded === lv.id;
          const Icon = lv.icon;
          return (
            <div key={lv.id}>
              <div className={cx('rounded-lg', activeLevel === lv.id && 'bg-slate-100 dark:bg-slate-800/70')}>
                <div className="flex items-center">
                  <a href={hrefs.level(lv.id)} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2">
                    <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white', c.bg)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        L{lv.id} · {lv.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <ProgressBar value={p} className="h-1.5" barClass={c.bar} />
                        <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-slate-500">{Math.round(p)}%</span>
                      </span>
                    </span>
                  </a>
                  <button type="button" aria-label={isOpen ? 'Collapse level' : 'Expand level'} onClick={() => setExpanded(isOpen ? null : lv.id)} className="mr-1 rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ChevronDown className={cx('h-4 w-4 transition', isOpen && 'rotate-180')} />
                  </button>
                </div>
              </div>
              {isOpen && (
                <ul className="mb-2 ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-800">
                  {lv.lessons.map((l) => {
                    const done = !!state.completedLessons[l.id];
                    return (
                      <li key={l.id}>
                        <a
                          href={hrefs.lesson(l.id)}
                          onClick={onNavigate}
                          className={cx(
                            'flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs',
                            activeId === l.id ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                          )}
                        >
                          {done ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-500" /> : <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />}
                          <span>{l.title}</span>
                        </a>
                      </li>
                    );
                  })}
                  {lv.labs.map((lab) => {
                    const sc = state.labScores[lab.id];
                    return (
                      <li key={lab.id}>
                        <a
                          href={hrefs.lab(lab.id)}
                          onClick={onNavigate}
                          className={cx(
                            'flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs',
                            activeId === lab.id ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                          )}
                        >
                          <FlaskConical className={cx('mt-px h-3.5 w-3.5 shrink-0', sc ? 'text-emerald-500' : c.text)} />
                          <span className="flex-1">
                            <span className="font-semibold">{lab.code}:</span> {lab.title}
                          </span>
                          {sc !== undefined && <span className="text-[10px] font-bold text-emerald-600">{sc}%</span>}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {importMsg && <p className="mb-2 rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{importMsg}</p>}
        <div className="grid grid-cols-3 gap-1.5">
          <button type="button" onClick={() => exportProgress(state)} className="flex flex-col items-center gap-0.5 rounded-lg p-2 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" title="Export progress JSON">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-0.5 rounded-lg p-2 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" title="Import progress JSON">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button
            type="button"
            onClick={() => setTheme(state.settings.theme === 'dark' ? 'light' : 'dark')}
            className="flex flex-col items-center gap-0.5 rounded-lg p-2 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Toggle theme"
          >
            {state.settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const parsed = JSON.parse(await f.text());
              if (!parsed || typeof parsed !== 'object' || !('completedLessons' in parsed)) throw new Error('not a progress file');
              importState(parsed);
              setImportMsg('✅ Progress imported successfully.');
            } catch {
              setImportMsg('⚠️ That file is not a valid AI PM Academy progress export.');
            }
            setTimeout(() => setImportMsg(null), 4000);
          }}
        />
      </div>
    </div>
  );
}

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const glossary = useGlossary();
  return (
    <div className="flex h-full">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <Sidebar route={route} onNavigate={() => undefined} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] animate-fade-in bg-white shadow-xl dark:bg-slate-900">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-2 top-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <Sidebar route={route} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200 bg-white/80 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/80">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold">AI PM Academy</span>
          <button type="button" onClick={() => glossary.open()} className="ml-auto rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Search glossary">
            <Search className="h-5 w-5" />
          </button>
        </header>
        <main id="main-scroll" className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
