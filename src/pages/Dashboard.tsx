import { useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Trophy,
  Activity,
  GraduationCap,
  FlaskConical,
  ListChecks,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Workflow,
  Hand,
  Briefcase,
  Swords,
} from 'lucide-react';
import { ALL_LABS, ALL_LESSONS, LEVELS, labById, lessonById } from '../data/curriculum';
import { COLORS, scoreTone } from '../lib/colors';
import { hrefs } from '../lib/router';
import { levelStats, masteryBreakdown, rankFor, RANKS, WEIGHTS } from '../lib/mastery';
import { exportProgress, useProgress } from '../store/progress';
import { timeAgo } from '../lib/format';
import { Badge, Button, Card, ProgressBar, SectionLabel, cx } from '../components/ui';

function Ring({ value, size = 140 }: { value: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={12} className="fill-none stroke-white/20" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={12}
        strokeLinecap="round"
        className="fill-none stroke-white transition-all duration-700"
        strokeDasharray={c}
        strokeDashoffset={c - (c * Math.min(100, value)) / 100}
      />
    </svg>
  );
}

export function Dashboard() {
  const { state, importState, resetAll } = useProgress();
  const m = masteryBreakdown(state);
  const rank = rankFor(m.overall);
  const nextRank = RANKS.find((r) => r.min > m.overall);
  const stats = levelStats(state);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const nextLesson = ALL_LESSONS.find((l) => !state.completedLessons[l.id]);
  const nextLab = ALL_LABS.find((l) => !state.labScores[l.id]);
  const lessonsDone = Object.keys(state.completedLessons).filter((id) => lessonById(id)).length;
  const quizzesTaken = Object.keys(state.quizScores).length;
  const labsStarted = ALL_LABS.filter((l) => state.labScores[l.id]).length;
  const scenarioScore = state.labScores['lab-6b'];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Ring value={m.overall} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">{Math.round(m.overall)}%</span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/80">Mastery</span>
            </div>
          </div>
          <div className="flex-1">
            <Badge className="bg-white/20 text-white">
              <Trophy className="h-3 w-3" /> {rank.title}
            </Badge>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Your AI Program Manager journey</h1>
            <p className="mt-1 max-w-xl text-sm text-white/85">{rank.blurb}</p>
            {nextRank && (
              <p className="mt-2 text-xs text-white/75">
                {Math.ceil(nextRank.min - m.overall)} more mastery points to reach <strong>{nextRank.title}</strong>.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {nextLesson && (
                <a href={hrefs.lesson(nextLesson.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50">
                  {lessonsDone === 0 ? 'Start lesson 1' : 'Continue'}: {nextLesson.title} <ArrowRight className="h-4 w-4" />
                </a>
              )}
              {nextLab && (
                <a href={hrefs.lab(nextLab.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/25">
                  <FlaskConical className="h-4 w-4" /> Next lab: {nextLab.code}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Lessons completed', value: m.lessonPct, sub: `${lessonsDone}/${ALL_LESSONS.length} lessons`, icon: GraduationCap, weight: WEIGHTS.lessons },
          { label: 'Knowledge checks', value: m.quizPct, sub: `${quizzesTaken} quizzes attempted`, icon: ListChecks, weight: WEIGHTS.quizzes },
          { label: 'Labs & simulators', value: m.labPct, sub: `${labsStarted}/${ALL_LABS.length} labs scored`, icon: FlaskConical, weight: WEIGHTS.labs },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <s.icon className="h-4 w-4 text-indigo-500" /> {s.label}
              </div>
              <span className="text-[10px] font-semibold uppercase text-slate-400">{Math.round(s.weight * 100)}% weight</span>
            </div>
            <div className={cx('mt-2 text-3xl font-extrabold', scoreTone(s.value).text)}>{Math.round(s.value)}%</div>
            <ProgressBar value={s.value} className="mt-2" barClass={scoreTone(s.value).bar} />
            <div className="mt-1.5 text-xs text-slate-500">{s.sub}</div>
          </Card>
        ))}
      </div>

      {lessonsDone === 0 && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-4 w-4" /> How every lesson works (a flat learning curve)
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lightbulb, t: '1. Explain Like I’m New', d: 'An everyday analogy with zero jargon.' },
              { icon: Workflow, t: '2. How It Actually Works', d: 'A step-by-step visual diagram you can click through.' },
              { icon: Hand, t: '3. Hands-On Sandbox', d: 'Sliders and toggles — see what breaks when you change things.' },
              { icon: Briefcase, t: '4. The AI PM Lens', d: 'When to use it, cost, failure modes and 3 questions for engineers.' },
            ].map((x) => (
              <div key={x.t} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <x.icon className="h-5 w-5 text-indigo-500" />
                <div className="mt-1.5 text-sm font-semibold">{x.t}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{x.d}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <SectionLabel>Levels</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ level, progress, lessonsDone: done }) => {
            const c = COLORS[level.color];
            const Icon = level.icon;
            return (
              <a key={level.id} href={hrefs.level(level.id)} className="group block">
                <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', c.gradient)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={cx('text-[11px] font-bold uppercase tracking-wider', c.text)}>Level {level.id}</div>
                      <div className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{level.title}</div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{level.tagline}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <ProgressBar value={progress} barClass={c.bar} />
                    <span className="w-9 text-right text-xs font-bold text-slate-600 dark:text-slate-300">{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-[11px] text-slate-500">
                    <span>
                      {done}/{level.lessons.length} lessons
                    </span>
                    <span>
                      {level.labs.filter((l) => state.labScores[l.id]).length}/{level.labs.length} labs
                    </span>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionLabel>Lab & simulator scoreboard</SectionLabel>
          <div className="space-y-2">
            {ALL_LABS.map((lab) => {
              const sc = state.labScores[lab.id] ?? 0;
              const tone = scoreTone(sc);
              return (
                <a key={lab.id} href={hrefs.lab(lab.id)} className="flex items-center gap-3 rounded-lg px-1 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <span className="w-14 shrink-0 text-xs font-bold text-slate-500">{lab.code}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{lab.title}</span>
                  <span className="hidden w-32 sm:block">
                    <ProgressBar value={sc} barClass={tone.bar} />
                  </span>
                  <span className={cx('w-10 text-right text-xs font-bold', sc ? tone.text : 'text-slate-400')}>{sc ? `${sc}%` : '—'}</span>
                </a>
              );
            })}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50 dark:border-indigo-900 dark:from-slate-900 dark:to-indigo-950/40">
            <SectionLabel>Chief AI PM simulator</SectionLabel>
            <div className="flex items-center gap-3">
              <Swords className="h-8 w-8 text-indigo-500" />
              <div>
                <div className={cx('text-2xl font-extrabold', scenarioScore ? scoreTone(scenarioScore).text : 'text-slate-400')}>{scenarioScore ? `${scenarioScore}%` : 'Not started'}</div>
                <div className="text-xs text-slate-500">Executive judgement score across 6 crisis scenarios</div>
              </div>
            </div>
            <a href={hrefs.lab('lab-6b')} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {scenarioScore ? 'Improve your score' : 'Take the simulator'} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card>
          <Card>
            <SectionLabel className="flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5" /> Bookmarks
            </SectionLabel>
            {state.bookmarks.length === 0 ? (
              <p className="text-xs text-slate-500">Bookmark any lesson or lab with the ribbon icon to keep it here.</p>
            ) : (
              <ul className="space-y-1">
                {state.bookmarks.map((id) => {
                  const l = lessonById(id);
                  const lab = labById(id);
                  if (!l && !lab) return null;
                  return (
                    <li key={id}>
                      <a href={l ? hrefs.lesson(id) : hrefs.lab(id)} className="flex items-center gap-1.5 rounded px-1 py-1 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        {l ? <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> : <FlaskConical className="h-3.5 w-3.5 text-emerald-500" />}
                        <span className="truncate">{l ? l.title : `${lab!.code}: ${lab!.title}`}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionLabel className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Recent activity
          </SectionLabel>
          {state.activity.length === 0 ? (
            <p className="text-xs text-slate-500">Your completed lessons and lab scores will appear here.</p>
          ) : (
            <ul className="space-y-1.5">
              {state.activity.slice(0, 8).map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <a href={a.href} className="truncate text-slate-700 hover:text-indigo-600 dark:text-slate-200">
                    {a.label}
                  </a>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(a.t)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionLabel>Your progress data</SectionLabel>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Everything — completed lessons, quiz scores, bookmarks, notes and lab outputs — is saved privately in this browser’s localStorage. Nothing is sent to any server. Export a JSON backup to move to another device.
          </p>
          {msg && <p className="mt-2 rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{msg}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportProgress(state)}>
              <Download className="h-4 w-4" /> Export progress JSON
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import progress JSON
            </Button>
            {!confirmReset ? (
              <Button variant="ghost" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            ) : (
              <span className="flex items-center gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    resetAll();
                    setConfirmReset(false);
                    setMsg('Progress reset. Fresh start!');
                  }}
                >
                  Yes, erase everything
                </Button>
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </span>
            )}
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
                if (!parsed || typeof parsed !== 'object' || !('completedLessons' in parsed)) throw new Error('bad');
                importState(parsed);
                setMsg('✅ Progress imported successfully.');
              } catch {
                setMsg('⚠️ That file is not a valid AI PM Academy progress export.');
              }
            }}
          />
          <div className="mt-3 text-[11px] text-slate-400">
            Learning since {new Date(state.createdAt).toLocaleDateString()} · {LEVELS.length} levels · {ALL_LESSONS.length} lessons · {ALL_LABS.length} labs
          </div>
        </Card>
      </div>
    </div>
  );
}
