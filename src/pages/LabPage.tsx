import { Suspense } from 'react';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Clock, FlaskConical } from 'lucide-react';
import { labById, levelById, nextItem, prevItem } from '../data/curriculum';
import { COLORS, scoreTone } from '../lib/colors';
import { hrefs } from '../lib/router';
import { useProgress } from '../store/progress';
import { LABS } from '../labs';
import { Loading } from '../components/Loading';
import { cx } from '../components/ui';
import { NotFound } from './NotFound';

export default function LabPage({ labId }: { labId: string }) {
  const { state, toggleBookmark } = useProgress();
  const lab = labById(labId);
  if (!lab) return <NotFound />;
  const level = levelById(lab.levelId)!;
  const c = COLORS[level.color];
  const LabComponent = LABS[lab.id];
  const bookmarked = state.bookmarks.includes(lab.id);
  const score = state.labScores[lab.id];
  const next = nextItem(lab.id);
  const prev = prevItem(lab.id);
  const Icon = lab.icon;

  return (
    <div className="space-y-5">
      <div className={cx('relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg sm:p-6', c.gradient)}>
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:flex">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
              <a href={hrefs.level(level.id)} className="hover:underline">
                Level {level.id} · {level.title}
              </a>
              <span>·</span>
              <span className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" /> {lab.code}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{lab.minutes} min
              </span>
            </div>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{lab.title}</h1>
            <p className="mt-1 text-sm text-white/90">{lab.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button type="button" onClick={() => toggleBookmark(lab.id)} className="rounded-lg bg-white/15 p-2 hover:bg-white/25" aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark lab'}>
              {bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
            </button>
            {score !== undefined && <span className={cx('rounded-full bg-white px-2 py-0.5 text-xs font-bold', scoreTone(score).text)}>{score}%</span>}
          </div>
        </div>
      </div>

      <Suspense fallback={<Loading label="Loading lab…" />}>{LabComponent ? <LabComponent /> : <p className="text-rose-600">Lab not found.</p>}</Suspense>

      <div className="flex justify-between gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
        {prev ? (
          <a href={prev.kind === 'lesson' ? hrefs.lesson(prev.id) : hrefs.lab(prev.id)} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600">
            <ChevronLeft className="h-4 w-4" /> <span className="max-w-[16rem] truncate">{prev.title}</span>
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={next.kind === 'lesson' ? hrefs.lesson(next.id) : hrefs.lab(next.id)} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600">
            <span className="max-w-[16rem] truncate">{next.title}</span> <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
