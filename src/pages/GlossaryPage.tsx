import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useGlossary } from '../components/GlossaryModal';
import { GLOSSARY } from '../data/glossary';
import { Button } from '../components/ui';

export default function GlossaryPage() {
  const g = useGlossary();
  useEffect(() => g.open(), [g]);
  return (
    <div className="py-16 text-center">
      <BookOpen className="mx-auto h-10 w-10 text-indigo-500" />
      <h1 className="mt-4 text-2xl font-bold">Quick Glossary & AI PM Cheat Sheet</h1>
      <p className="mt-2 text-slate-500">{GLOSSARY.length} plain-English terms, searchable from anywhere with Ctrl/⌘ + K.</p>
      <Button className="mt-6" onClick={() => g.open()}>Open glossary</Button>
    </div>
  );
}
