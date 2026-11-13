import { Compass } from 'lucide-react';
import { hrefs } from '../lib/router';

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <Compass className="mx-auto h-10 w-10 text-slate-400" />
      <h1 className="mt-4 text-2xl font-bold">This page wandered off the map</h1>
      <p className="mt-2 text-slate-500">The link may be outdated. Head back to your dashboard to continue learning.</p>
      <a href={hrefs.dashboard()} className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        Go to dashboard
      </a>
    </div>
  );
}
