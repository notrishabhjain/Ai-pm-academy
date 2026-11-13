import { ArrowRight, CheckCircle2, Clock, FlaskConical, Target, Lightbulb, Workflow, Hand, Briefcase } from 'lucide-react';
import { levelById, LEVELS } from '../data/curriculum';
import { COLORS, scoreTone } from '../lib/colors';
import { hrefs } from '../lib/router';
import { levelProgress } from '../lib/mastery';
import { useProgress } from '../store/progress';
import { Badge, Card, ProgressBar, SectionLabel, cx } from '../components/ui';
import { NotFound } from './NotFound';

export function LevelPage({ levelId }: { levelId: number }) {
  const { state } = useProgress();
  const level = levelById(levelId);
  if (!level) return <NotFound />;
  const c = COLORS[level.color];
  const p = levelProgress(level, state);
  const Icon = level.icon;
  const next = LEVELS[levelId + 1];

  return (
    <div className="space-y-6">
      <div className={cx('relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg sm:p-8', c.gradient)}>
        <div className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
            <Icon className="h-4 w-4" /> Level {level.id} of {LEVELS.length - 1}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{level.title}</h1>
          <p className="mt-1 text-white/90">{level.tagline}</p>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/15 p-3 text-sm">
            <Target className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>By the end you will:</strong> {level.outcome}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${p}%` }} />
            </div>
            <span className="text-sm font-bold">{Math.round(p)}% complete</span>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Lessons</SectionLabel>
        <div className="grid gap-3">
          {level.lessons.map((l, i) => {
            const done = !!state.completedLessons[l.id];
            const quiz = state.quizScores[l.id];
            return (
              <a key={l.id} href={hrefs.lesson(l.id)} className="group block">
                <Card className="transition group-hover:border-indigo-300 group-hover:shadow-md dark:group-hover:border-indigo-800">
                  <div className="flex items-start gap-4">
                    <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold', done ? 'bg-emerald-500 text-white' : c.chip)}>
                      {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">{l.title}</h3>
                        {quiz && <Badge tone={quiz.best === quiz.total ? 'green' : 'amber'}>Quiz {quiz.best}/{quiz.total}</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{l.summary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {l.minutes} min
                        </span>
                        <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Analogy</span>
                        <span className="flex items-center gap-1"><Workflow className="h-3 w-3" /> Visual diagram</span>
                        <span className="flex items-center gap-1"><Hand className="h-3 w-3" /> Sandbox: {l.sandboxTitle}</span>
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> PM lens</span>
                      </div>
                    </div>
                    <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Interactive labs</SectionLabel>
        <div className="grid gap-3 md:grid-cols-2">
          {level.labs.map((lab) => {
            const sc = state.labScores[lab.id];
            const LabIcon = lab.icon;
            return (
              <a key={lab.id} href={hrefs.lab(lab.id)} className="group block">
                <Card className={cx('h-full border-2 transition group-hover:shadow-md', c.border)}>
                  <div className="flex items-start gap-3">
                    <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', c.gradient)}>
                      <LabIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cx('text-xs font-bold uppercase', c.text)}>{lab.code}</span>
                        {sc !== undefined && <span className={cx('text-xs font-bold', scoreTone(sc).text)}>· {sc}%</span>}
                      </div>
                      <h3 className="font-bold leading-snug text-slate-900 dark:text-white">{lab.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{lab.summary}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                        <FlaskConical className="h-3 w-3" /> ~{lab.minutes} min hands-on
                      </div>
                    </div>
                  </div>
                  {sc !== undefined && <ProgressBar value={sc} className="mt-3" barClass={scoreTone(sc).bar} />}
                </Card>
              </a>
            );
          })}
        </div>
      </div>

      {next && (
        <a href={hrefs.level(next.id)} className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300 p-4 text-sm hover:border-indigo-400 dark:border-slate-700">
          <span>
            <span className="text-xs text-slate-500">Up next</span>
            <span className="block font-semibold">
              Level {next.id}: {next.title}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-indigo-500" />
        </a>
      )}
    </div>
  );
}
