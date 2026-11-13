import { Suspense, lazy, useEffect } from 'react';
import { Layout } from './components/Layout';
import { GlossaryProvider } from './components/GlossaryModal';
import { ProgressProvider } from './store/progress';
import { parseRoute, useHashPath } from './lib/router';
import { Dashboard } from './pages/Dashboard';
import { LevelPage } from './pages/LevelPage';
import { NotFound } from './pages/NotFound';
import { Loading } from './components/Loading';

const LessonPage = lazy(() => import('./pages/LessonPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));

export default function App() {
  const path = useHashPath();
  const route = parseRoute(path);

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
  }, [path]);

  return (
    <ProgressProvider>
      <GlossaryProvider>
        <Layout route={route}>
          <Suspense fallback={<Loading />}>
            {route.name === 'dashboard' && <Dashboard />}
            {route.name === 'level' && <LevelPage levelId={route.levelId} />}
            {route.name === 'lesson' && <LessonPage key={route.lessonId} lessonId={route.lessonId} />}
            {route.name === 'lab' && <LabPage key={route.labId} labId={route.labId} />}
            {route.name === 'glossary' && <GlossaryPage />}
            {route.name === 'notfound' && <NotFound />}
          </Suspense>
        </Layout>
      </GlossaryProvider>
    </ProgressProvider>
  );
}
