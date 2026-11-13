import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Copy, Check, Wand2, Eye, PencilLine, CheckCircle2, Circle, Eraser } from 'lucide-react';
import { Button, Callout, Card, Meter, Missions, ProgressBar, cx } from '../components/ui';
import { downloadText } from '../lib/format';
import { useLabData } from '../store/progress';

type FieldType = 'text' | 'textarea' | 'select' | 'multi';
interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  example: string | string[];
  required?: boolean;
  hint?: string;
}
interface Step {
  id: string;
  title: string;
  help: string;
  fields: Field[];
}

const STEPS: Step[] = [
  {
    id: 'overview',
    title: 'Overview',
    help: 'Name the feature, its owner and who must sign off.',
    fields: [
      { key: 'name', label: 'Feature / product name', type: 'text', required: true, placeholder: 'e.g. Grievance Triage Assistant', example: 'AI Grievance Triage Assistant (CM Helpline)' },
      { key: 'owner', label: 'Product owner', type: 'text', required: true, placeholder: 'Name, role', example: 'A. Sharma, Program Manager — Digital Services Cell' },
      { key: 'stakeholders', label: 'Stakeholders & approvers', type: 'textarea', required: true, placeholder: 'Business owner, engineering, legal/DPO, security, frontline staff…', example: 'Joint Secretary (Citizen Services) — business owner\nCTO, State e-Gov Agency — engineering\nData Protection Officer — privacy sign-off\nCISO — security sign-off\nHelpline supervisors — end-user representatives' },
      { key: 'version', label: 'PRD version', type: 'text', placeholder: 'v0.1', example: 'v1.0 (draft for steering committee)' },
    ],
  },
  {
    id: 'problem',
    title: 'Problem statement',
    help: 'Describe the pain in business terms with numbers — never start from “we want to use AI”.',
    fields: [
      { key: 'problem', label: 'Problem', type: 'textarea', required: true, placeholder: 'What is broken today, for whom, and how badly?', example: '40,000 grievances arrive daily via WhatsApp, portal and call centre in 12 languages. 23% are routed to the wrong department, adding 4.2 days on average and generating repeat complaints.' },
      { key: 'users', label: 'Primary users', type: 'textarea', required: true, placeholder: 'Who uses the output?', example: 'Helpline triage officers (120), department nodal officers (300); indirectly, citizens filing grievances.' },
      { key: 'metrics', label: 'Success metrics & targets', type: 'textarea', required: true, placeholder: 'Outcome metrics with baseline → target', example: 'Misrouting rate: 23% → < 8%\nMedian time-to-department: 4.2 days → < 1 day\nRepeat-complaint rate: 18% → < 10%\nOfficer satisfaction (survey): ≥ 4/5' },
    ],
  },
  {
    id: 'baseline',
    title: 'Non-AI baseline',
    help: 'What would the simplest non-AI solution achieve? AI must beat it on value per rupee.',
    fields: [
      { key: 'current', label: 'Current process', type: 'textarea', required: true, placeholder: 'How it works today', example: 'Officers read each grievance and pick a department from a 46-item dropdown; ~90 seconds per grievance.' },
      { key: 'nonai', label: 'Simplest non-AI alternative & its performance', type: 'textarea', required: true, placeholder: 'Rules, better form, search…', example: 'Keyword rules prototype (2 weeks): 64% routing accuracy on 500 sampled grievances; fails on Hinglish and voice-note transcripts.' },
      { key: 'whyai', label: 'Why AI is justified', type: 'textarea', required: true, placeholder: 'Evidence that AI is needed', example: 'Pilot prompt on a small model reached 88% on the same sample, including code-mixed text, at ~₹0.04 per grievance.' },
    ],
  },
  {
    id: 'architecture',
    title: 'Model / RAG architecture',
    help: 'Record the architecture decision, the constraints that drove it, and the alternatives you rejected.',
    fields: [
      { key: 'approach', label: 'Approach', type: 'select', required: true, options: ['Prompting only', 'RAG (retrieval-augmented generation)', 'Fine-tuned model', 'Agent with tools', 'Hybrid: RAG + router', 'Classical ML + LLM fallback'], example: 'Hybrid: RAG + router' },
      { key: 'tier', label: 'Model tier', type: 'select', required: true, options: ['Small / fast', 'Balanced', 'Frontier', 'Reasoning', 'Open-weights self-hosted', 'Router (small → frontier escalation)'], example: 'Router (small → frontier escalation)' },
      { key: 'hosting', label: 'Hosting & data sovereignty', type: 'select', required: true, options: ['Public API (global)', 'API in Indian region', 'Government cloud (MeghRaj-style)', 'On-premises / air-gapped'], example: 'API in Indian region' },
      { key: 'knowledge', label: 'Knowledge sources & tools', type: 'textarea', placeholder: 'Documents, databases, APIs', example: 'Department taxonomy + routing SOP (RAG, re-indexed weekly); grievance DB (read-only tool: get_grievance_history).' },
      { key: 'rationale', label: 'Rationale & alternatives considered', type: 'textarea', required: true, placeholder: 'Why this, not that?', example: 'Fine-tuning rejected: taxonomy changes monthly. Frontier-only rejected: ₹38 L/month at volume. Router keeps 80% of traffic on the small model; low-confidence cases escalate.' },
    ],
  },
  {
    id: 'uat',
    title: 'Golden dataset & UAT criteria',
    help: 'Define “good enough” before building. This is the AI equivalent of UAT sign-off.',
    fields: [
      { key: 'datasetSize', label: 'Golden dataset size & owner', type: 'text', required: true, placeholder: 'e.g. 300 cases, owned by…', example: '300 cases (v1), owned by Helpline QA lead; SME sign-off by 3 senior triage officers' },
      { key: 'categories', label: 'Categories covered', type: 'multi', required: true, options: ['Happy path', 'Edge / ambiguous', 'Hindi & code-mixed', 'Adversarial / injection', 'Out-of-scope', 'PII-sensitive', 'Voice-note transcripts'], example: ['Happy path', 'Edge / ambiguous', 'Hindi & code-mixed', 'Adversarial / injection', 'Out-of-scope', 'PII-sensitive', 'Voice-note transcripts'] },
      { key: 'gates', label: 'Release gates (metrics & thresholds)', type: 'textarea', required: true, placeholder: 'Pass rates per category, faithfulness…', example: 'Routing accuracy ≥ 92% overall; no language < 85%\n100% pass on adversarial & PII cases\nCorrect “unsure → human” rate ≥ 95% on ambiguous cases\nNo regression > 2 pts vs previous release' },
      { key: 'regression', label: 'Regression & re-evaluation policy', type: 'textarea', placeholder: 'When do evals run?', example: 'Full suite on every prompt/model/taxonomy change and weekly on 2% production sample; reviewer overrides added to the dataset monthly.' },
    ],
  },
  {
    id: 'guardrails',
    title: 'Latency & cost guardrails',
    help: 'Put numbers on speed and spend so engineering can design for them.',
    fields: [
      { key: 'latency', label: 'Latency targets', type: 'text', required: true, placeholder: 'p95 total, TTFT', example: 'p95 end-to-end ≤ 2.5 s; batch backlog cleared within 15 min' },
      { key: 'costReq', label: 'Cost per request ceiling', type: 'text', required: true, placeholder: '₹ per request', example: '≤ ₹0.08 per grievance (blended)' },
      { key: 'costMonth', label: 'Monthly budget cap & alerts', type: 'text', required: true, placeholder: '₹ / month, alert thresholds', example: '₹3.5 L/month cap; alert at 70% and 90%; auto-switch to small-model-only mode at 100%' },
      { key: 'opt', label: 'Cost optimisation plan', type: 'textarea', placeholder: 'Caching, routing, max tokens…', example: 'Prompt caching on taxonomy prefix; max output 60 tokens (JSON only); router; batch API for overnight backlog.' },
    ],
  },
  {
    id: 'safety',
    title: 'Safety, privacy & compliance',
    help: 'Plan guardrails and legal obligations up front — they shape architecture.',
    fields: [
      { key: 'pii', label: 'Personal data handling', type: 'textarea', required: true, placeholder: 'What PII, why, masking, retention', example: 'Mask Aadhaar, PAN, phone and email before model calls; retain raw text only in the grievance DB; model logs store masked text for 180 days.' },
      { key: 'injection', label: 'Prompt-injection & misuse defences', type: 'textarea', required: true, placeholder: 'Input filters, instruction/data separation…', example: 'Grievance text wrapped as data; input classifier; output must match routing JSON schema (no free text) — limits blast radius.' },
      { key: 'audit', label: 'Audit logging', type: 'textarea', required: true, placeholder: 'What is logged, where, how long', example: 'Log prompt version, model version, retrieved SOP chunks, output, confidence, officer override and reason — tamper-evident store, 3 years.' },
      { key: 'risk', label: 'Regulatory risk classification', type: 'select', required: true, options: ['Low risk (internal productivity)', 'Limited risk (transparency duties)', 'High risk (affects access to public services)', 'Prohibited / not allowed'], example: 'Limited risk (transparency duties)' },
      { key: 'dpdp', label: 'DPDP Act / legal notes', type: 'textarea', placeholder: 'Consent, purpose limitation, DPIA…', example: 'Processing under the grievance-redressal purpose stated at collection; DPIA completed; DPO sign-off required before pilot; vendor DPA with India data residency.' },
    ],
  },
  {
    id: 'fallback',
    title: 'Fallback UX & rollout',
    help: 'Decide what happens when the AI is unsure, wrong or down — and how you will roll out safely.',
    fields: [
      { key: 'lowconf', label: 'Low-confidence behaviour', type: 'textarea', required: true, placeholder: 'What happens below threshold?', example: 'Confidence < 0.85 → grievance stays in the officer queue with the top-3 suggested departments and reasons.' },
      { key: 'outage', label: 'Outage behaviour', type: 'textarea', required: true, placeholder: 'If the model/API is unavailable', example: 'Automatic fallback to manual dropdown routing with a banner; queue continues; no citizen-facing impact.' },
      { key: 'hitl', label: 'Human-in-the-loop rules', type: 'textarea', placeholder: 'Which decisions always need a human?', example: 'Officers can override any routing in one click; 5% random sample of auto-routed grievances reviewed daily.' },
      { key: 'rollout', label: 'Rollout & rollback plan', type: 'textarea', required: true, placeholder: 'Stages, success criteria, rollback triggers', example: 'Shadow mode 2 weeks → 2 districts (suggest-only) → 10 districts (auto-route ≥ 0.85) → state-wide. Roll back if misrouting > 12% for 2 consecutive days.' },
      { key: 'monitoring', label: 'Monitoring & ownership', type: 'textarea', placeholder: 'Dashboards, owners, review cadence', example: 'Weekly quality/cost dashboard reviewed by product owner; on-call engineer for latency/error alerts; monthly steering review.' },
    ],
  },
];

type Values = Record<string, string | string[]>;

function isFilled(v: string | string[] | undefined) {
  return Array.isArray(v) ? v.length > 0 : !!v && v.trim().length > 0;
}

function buildMarkdown(v: Values): string {
  const g = (k: string) => {
    const x = v[k];
    return Array.isArray(x) ? x.join(', ') : (x ?? '').trim() || '_TBD_';
  };
  const block = (k: string) => {
    const x = v[k];
    const s = Array.isArray(x) ? x.map((i) => `- ${i}`).join('\n') : (x ?? '').trim();
    if (!s) return '_TBD_';
    return s.includes('\n') && !Array.isArray(x) ? s.split('\n').map((l) => (l.trim().startsWith('-') ? l : `- ${l}`)).join('\n') : s;
  };
  return `# AI PRD: ${g('name')}

| | |
|---|---|
| **Owner** | ${g('owner')} |
| **Version** | ${g('version')} |
| **Last updated** | ${new Date().toISOString().slice(0, 10)} |

### Stakeholders & approvers
${block('stakeholders')}

## 1. Problem statement
${block('problem')}

**Primary users:** ${g('users')}

### Success metrics
${block('metrics')}

## 2. Non-AI baseline
**Current process:** ${g('current')}

**Simplest non-AI alternative:** ${g('nonai')}

**Why AI is justified:** ${g('whyai')}

## 3. Model / RAG architecture
| Decision | Choice |
|---|---|
| Approach | ${g('approach')} |
| Model tier | ${g('tier')} |
| Hosting & sovereignty | ${g('hosting')} |

**Knowledge sources & tools:** ${g('knowledge')}

**Rationale & alternatives considered:** ${g('rationale')}

## 4. Golden dataset & UAT criteria
**Dataset:** ${g('datasetSize')}

**Categories covered:**
${block('categories')}

### Release gates
${block('gates')}

**Regression policy:** ${g('regression')}

## 5. Latency & cost guardrails
| Guardrail | Target |
|---|---|
| Latency | ${g('latency')} |
| Cost per request | ${g('costReq')} |
| Monthly budget & alerts | ${g('costMonth')} |

**Optimisation plan:** ${g('opt')}

## 6. Safety, privacy & compliance
**Personal data handling:** ${g('pii')}

**Prompt-injection & misuse defences:** ${g('injection')}

**Audit logging:** ${g('audit')}

**Regulatory risk classification:** ${g('risk')}

**DPDP / legal notes:** ${g('dpdp')}

## 7. Fallback UX & rollout
**Low-confidence behaviour:** ${g('lowconf')}

**Outage behaviour:** ${g('outage')}

**Human-in-the-loop rules:** ${g('hitl')}

### Rollout & rollback
${block('rollout')}

**Monitoring & ownership:** ${g('monitoring')}

---
_Generated with AI PM Academy — PRD Builder._
`;
}

export default function Lab6APrdBuilder() {
  const [values, setValues] = useLabData<Values>('lab-6a:prd', {});
  const [stepIdx, setStepIdx] = useState(0);
  const [view, setView] = useState<'form' | 'preview'>('form');
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useLabData<boolean>('lab-6a:exported', false);
  const step = STEPS[stepIdx];

  const required = STEPS.flatMap((s) => s.fields.filter((f) => f.required));
  const filledRequired = required.filter((f) => isFilled(values[f.key])).length;
  const completeness = (filledRequired / required.length) * 100;
  const stepDone = (s: Step) => s.fields.filter((f) => f.required).every((f) => isFilled(values[f.key]));
  const md = buildMarkdown(values);
  const numericGates = /\d/.test(String(values.gates ?? '')) && /\d/.test(String(values.latency ?? '')) && /\d/.test(String(values.costReq ?? ''));

  const setField = (k: string, v: string | string[]) => setValues({ ...values, [k]: v });
  const fillStep = () => {
    const next = { ...values };
    step.fields.forEach((f) => {
      if (!isFilled(next[f.key])) next[f.key] = f.example;
    });
    setValues(next);
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[220px] flex-1">
            <Meter label="PRD completeness (required fields)" value={completeness} suffix="%" />
          </div>
          <div className="flex gap-2">
            <Button variant={view === 'form' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('form')}>
              <PencilLine className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant={view === 'preview' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('preview')}>
              <Eye className="h-3.5 w-3.5" /> Markdown preview
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                downloadText(`AI-PRD-${String(values.name ?? 'draft').replace(/[^\w-]+/g, '-').slice(0, 40) || 'draft'}.md`, md);
                setExported(true);
              }}
            >
              <Download className="h-3.5 w-3.5" /> Export .md
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(md).catch(() => undefined);
                setCopied(true);
                setExported(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <Card padded={false} className="h-fit p-2">
          {STEPS.map((s, i) => (
            <button
              type="button"
              key={s.id}
              onClick={() => {
                setStepIdx(i);
                setView('form');
              }}
              className={cx('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm', i === stepIdx && view === 'form' ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800')}
            >
              {stepDone(s) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
              <span>
                {i + 1}. {s.title}
              </span>
            </button>
          ))}
          <div className="px-3 py-2">
            <ProgressBar value={(STEPS.filter(stepDone).length / STEPS.length) * 100} barClass="bg-emerald-500" />
            <div className="mt-1 text-[11px] text-slate-500">
              {STEPS.filter(stepDone).length}/{STEPS.length} sections complete
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear the whole PRD draft?')) setValues({});
            }}
            className="mx-3 mb-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600"
          >
            <Eraser className="h-3 w-3" /> Clear draft
          </button>
        </Card>

        {view === 'form' ? (
          <Card key={step.id} className="animate-fade-in">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                Step {stepIdx + 1} of {STEPS.length}: {step.title}
              </h2>
              <Button size="sm" variant="secondary" onClick={fillStep}>
                <Wand2 className="h-3.5 w-3.5" /> Fill empty fields with an example
              </Button>
            </div>
            <p className="mb-4 text-sm text-slate-500">{step.help}</p>
            <div className="space-y-4">
              {step.fields.map((f) => {
                const v = values[f.key];
                return (
                  <div key={f.key}>
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </label>
                    {f.type === 'text' && <input value={(v as string) ?? ''} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900" />}
                    {f.type === 'textarea' && <textarea value={(v as string) ?? ''} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900" />}
                    {f.type === 'select' && (
                      <select value={(v as string) ?? ''} onChange={(e) => setField(f.key, e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900">
                        <option value="">Select…</option>
                        {f.options!.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    )}
                    {f.type === 'multi' && (
                      <div className="flex flex-wrap gap-2">
                        {f.options!.map((o) => {
                          const arr = Array.isArray(v) ? v : [];
                          const on = arr.includes(o);
                          return (
                            <button type="button" key={o} onClick={() => setField(f.key, on ? arr.filter((x) => x !== o) : [...arr, o])} className={cx('rounded-full border px-3 py-1 text-xs font-medium', on ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}>
                              {on ? '✓ ' : ''}
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {!isFilled(v) && <p className="mt-1 text-[11px] text-slate-400">Example: {Array.isArray(f.example) ? f.example.join(', ') : f.example.split('\n')[0]}</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="secondary" disabled={stepIdx === 0} onClick={() => setStepIdx(stepIdx - 1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {stepIdx < STEPS.length - 1 ? (
                <Button onClick={() => setStepIdx(stepIdx + 1)}>
                  Next: {STEPS[stepIdx + 1].title} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="success" onClick={() => setView('preview')}>
                  <Eye className="h-4 w-4" /> Review the full PRD
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="animate-fade-in">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Markdown preview — exactly what gets exported</div>
            <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200">{md}</pre>
          </Card>
        )}
      </div>

      <Callout tone="tip" title="Reviewer’s checklist before you circulate">
        Could an engineer build to this? Could QA write the golden dataset from it? Could finance check the cost cap? Could the DPO approve the data handling? Does every requirement contain a number you could test?
      </Callout>

      <Missions
        labId="lab-6a"
        score={Math.round(completeness * 0.85 + (exported ? 15 : 0))}
        missions={[
          { id: 'all', label: 'Complete every required field in all 8 sections', done: completeness === 100 },
          { id: 'numbers', label: 'Write testable numbers in release gates, latency and cost targets', done: numericGates },
          { id: 'fallback', label: 'Define both low-confidence and outage fallback behaviour', done: isFilled(values.lowconf) && isFilled(values.outage) },
          { id: 'export', label: 'Export or copy the PRD as Markdown', done: exported },
        ]}
      />
    </div>
  );
}
