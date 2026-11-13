import { useState } from 'react';
import { ListChecks, Table2, Sparkles, ArrowRight, RotateCcw, Trophy, Building2, Database, Gauge, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Button, Callout, Card, Missions, ProgressBar, cx } from '../components/ui';
import { useLabData } from '../store/progress';

type Choice = 'rules' | 'ml' | 'genai';
interface OptionEval {
  cost: number; // 0–100, higher = more expensive
  accuracy: number;
  overEng: number;
  note: string;
}
interface Brief {
  id: string;
  sector: string;
  title: string;
  brief: string;
  facts: { label: string; value: string }[];
  best: Choice;
  why: string;
  options: Record<Choice, OptionEval>;
}

const BRIEFS: Brief[] = [
  {
    id: 'pension',
    sector: 'State Finance Department',
    title: 'Pension eligibility check',
    brief: 'Officers want a tool that tells them whether a retiring employee is eligible for pension and computes the monthly amount. The rules are in a 2-page government order: minimum 10 years of qualifying service, amount = 50% of last basic pay (with a few documented exceptions).',
    facts: [
      { label: 'Input', value: 'Structured HR records (dates, pay, service)' },
      { label: 'Volume', value: '~2,000 cases / month' },
      { label: 'Must be', value: 'Exact and auditable' },
    ],
    best: 'rules',
    why: 'The logic is fixed, short and must be exact. A rules engine or SQL formula is free to run, 100% repeatable and auditable line by line. An LLM could mis-calculate and would be impossible to defend in an audit.',
    options: {
      rules: { cost: 5, accuracy: 99, overEng: 0, note: 'Implements the government order exactly; every result traceable to a rule.' },
      ml: { cost: 35, accuracy: 88, overEng: 60, note: 'Learns an approximation of a formula you already know — strictly worse and needs labelled history.' },
      genai: { cost: 70, accuracy: 80, overEng: 95, note: 'Probabilistic arithmetic on pensions; occasional wrong amounts and no audit trail.' },
    },
  },
  {
    id: 'routing',
    sector: 'Chief Minister’s Grievance Cell',
    title: 'Route free-text grievances to the right department',
    brief: 'The cell receives ~40,000 grievances a day through WhatsApp, the portal and call-centre notes. Text is in 12 languages, often code-mixed (Hinglish), with typos and voice-note transcripts. Today 23% are misrouted, adding days of delay.',
    facts: [
      { label: 'Input', value: 'Messy, multilingual free text' },
      { label: 'Volume', value: '40,000 / day' },
      { label: 'History', value: 'Inconsistent department labels' },
    ],
    best: 'genai',
    why: 'Messy, code-mixed, multilingual language is exactly where LLMs beat keyword rules and classical text classifiers. Use a small/fast model with a fixed taxonomy and structured output, evaluate on a golden set per language, and route low-confidence cases to humans.',
    options: {
      rules: { cost: 5, accuracy: 45, overEng: 0, note: 'Keyword rules collapse on typos, Hinglish and 12 languages.' },
      ml: { cost: 25, accuracy: 68, overEng: 10, note: 'Needs clean labels per language you don’t have; brittle on code-mixed text.' },
      genai: { cost: 55, accuracy: 91, overEng: 10, note: 'Understands messy multilingual text; constrain with an enum taxonomy and evals.' },
    },
  },
  {
    id: 'default',
    sector: 'State Electricity Distribution Company',
    title: 'Predict which consumers will default next month',
    brief: 'The DISCOM has 5 years of monthly billing data for 2 million consumers: payment history, tariff category, arrears, meter type, region. Collections wants a ranked list of likely defaulters to prioritise outreach.',
    facts: [
      { label: 'Input', value: 'Clean tabular history' },
      { label: 'Labels', value: 'Known defaults for 5 years' },
      { label: 'Output', value: 'Risk score per consumer' },
    ],
    best: 'ml',
    why: 'Predicting a probability from tabular history with known outcomes is classic supervised ML (e.g. gradient-boosted trees). It is accurate, cheap to score millions of rows, and explainable via feature importance. LLMs are poor and expensive at numeric prediction over tables.',
    options: {
      rules: { cost: 5, accuracy: 62, overEng: 0, note: '“Arrears > 2 months” catches the obvious cases but misses patterns.' },
      ml: { cost: 20, accuracy: 89, overEng: 5, note: 'Learns subtle patterns from millions of labelled rows; cheap batch scoring.' },
      genai: { cost: 90, accuracy: 70, overEng: 85, note: 'Reading 2M tabular rows through an LLM is slow, costly and less accurate.' },
    },
  },
  {
    id: 'duplicates',
    sector: 'Agriculture Subsidy Scheme',
    title: 'Flag duplicate subsidy applications',
    brief: 'Audit found farmers receiving the same subsidy twice. Duplicates share the same Aadhaar-linked bank account or the same land survey number within one season. The department wants every such pair flagged before payment.',
    facts: [
      { label: 'Input', value: 'Structured application database' },
      { label: 'Definition', value: 'Exact match on account / survey no.' },
      { label: 'Must be', value: 'Complete and explainable' },
    ],
    best: 'rules',
    why: 'The duplicate definition is exact. A SQL self-join on bank account and survey number finds 100% of cases in seconds, at zero marginal cost, with an explanation for each flag. (Fuzzy name matching could be a later add-on.)',
    options: {
      rules: { cost: 3, accuracy: 99, overEng: 0, note: 'GROUP BY account, survey_no, season HAVING COUNT(*) > 1 — done.' },
      ml: { cost: 30, accuracy: 85, overEng: 65, note: 'Approximates an exact rule and misses some pairs.' },
      genai: { cost: 80, accuracy: 70, overEng: 95, note: 'An LLM comparing rows pairwise is absurdly expensive and still misses some.' },
    },
  },
  {
    id: 'audit',
    sector: 'Office of the Principal Secretary',
    title: 'Summarise 200-page audit reports',
    brief: 'The Secretary receives 15–20 audit and inspection reports a month, each 100–200 pages. They want a one-page brief per report: key findings, financial impact, responsible departments and recommended actions — with page references.',
    facts: [
      { label: 'Input', value: 'Long unstructured PDFs' },
      { label: 'Volume', value: '~20 reports / month' },
      { label: 'Need', value: 'Faithful summary with citations' },
    ],
    best: 'genai',
    why: 'Reading long documents and writing structured summaries is a core LLM strength. Low volume keeps cost trivial. Require page citations, use a strict faithfulness check, and keep a human reviewer before anything reaches the Secretary.',
    options: {
      rules: { cost: 5, accuracy: 20, overEng: 0, note: 'Keyword extraction can’t understand findings or impact.' },
      ml: { cost: 40, accuracy: 35, overEng: 30, note: 'Classical extractive summarisers produce disjointed sentences.' },
      genai: { cost: 30, accuracy: 90, overEng: 5, note: 'High-quality cited briefs at a few rupees per report.' },
    },
  },
  {
    id: 'footfall',
    sector: 'Regional Passport Office',
    title: 'Forecast daily footfall for staffing',
    brief: 'Kendras want to forecast daily applicant footfall 4 weeks ahead to plan counter staff. They have 6 years of daily appointment and walk-in counts per centre, plus holidays and exam calendars.',
    facts: [
      { label: 'Input', value: 'Daily time-series per centre' },
      { label: 'Output', value: 'Numeric forecast' },
      { label: 'Centres', value: '300' },
    ],
    best: 'ml',
    why: 'Numeric forecasting from historical time series with seasonality and holidays is a classical ML / statistical forecasting job. It is accurate, cheap and gives confidence intervals. LLMs are not designed for precise numeric forecasting.',
    options: {
      rules: { cost: 3, accuracy: 60, overEng: 0, note: '“Same as last year + 5%” ignores holidays and trends.' },
      ml: { cost: 15, accuracy: 88, overEng: 5, note: 'Time-series models capture seasonality, holidays and trends.' },
      genai: { cost: 60, accuracy: 55, overEng: 80, note: 'LLMs guess numbers; no reliable uncertainty estimates.' },
    },
  },
  {
    id: 'mis',
    sector: 'Department of Social Welfare',
    title: 'Monthly district-wise MIS report',
    brief: 'The Minister wants a monthly report of applications received, approved, rejected and pending — by district and scheme — with month-on-month change. All data sits in the scheme database.',
    facts: [
      { label: 'Input', value: 'Structured database' },
      { label: 'Output', value: 'Fixed tables & charts' },
      { label: 'Must be', value: 'Exactly right' },
    ],
    best: 'rules',
    why: 'This is a SQL query and a BI dashboard. Aggregations must be exact and reproducible. A GenAI “chat with your data” layer might be a nice extra later, but the core report should never depend on an LLM getting counts right.',
    options: {
      rules: { cost: 3, accuracy: 100, overEng: 0, note: 'A scheduled SQL query + dashboard: exact and free.' },
      ml: { cost: 30, accuracy: 70, overEng: 75, note: 'There is nothing to predict — just count.' },
      genai: { cost: 50, accuracy: 75, overEng: 90, note: 'LLM-generated counts can be subtly wrong; numbers lose credibility.' },
    },
  },
  {
    id: 'fraud',
    sector: 'Public Health Insurance Scheme',
    title: 'Detect fraudulent hospital claims',
    brief: 'The scheme processes 1.2 lakh claims a month from empanelled hospitals. Investigators have confirmed 18,000 fraudulent claims in the last 3 years. Claims data is tabular: procedure codes, amounts, length of stay, hospital, patient history.',
    facts: [
      { label: 'Input', value: 'Tabular claims data' },
      { label: 'Labels', value: '18,000 confirmed fraud cases' },
      { label: 'Output', value: 'Fraud-risk score for review' },
    ],
    best: 'ml',
    why: 'Labelled tabular data at volume → supervised classical ML (plus rules for known patterns). It scores every claim cheaply, ranks them for investigators and can explain which features drove the score. GenAI can help investigators summarise case files afterwards.',
    options: {
      rules: { cost: 5, accuracy: 65, overEng: 0, note: 'Rules catch known patterns but fraudsters adapt.' },
      ml: { cost: 20, accuracy: 90, overEng: 5, note: 'Learns evolving fraud patterns from 18k labelled examples.' },
      genai: { cost: 85, accuracy: 68, overEng: 75, note: 'Expensive per claim and weaker on numeric patterns.' },
    },
  },
  {
    id: 'handwritten',
    sector: 'Revenue Department (Land Records)',
    title: 'Extract fields from scanned handwritten forms',
    brief: 'Decades of mutation registers and handwritten application forms (Hindi and English, varying layouts, stamps, margin notes) must be digitised into structured fields: owner name, survey number, area, date, remarks.',
    facts: [
      { label: 'Input', value: 'Scanned images, handwriting' },
      { label: 'Layouts', value: 'Dozens, inconsistent' },
      { label: 'Volume', value: '3 million pages (one-time)' },
    ],
    best: 'genai',
    why: 'Varied handwritten layouts with margin notes need modern vision-language models that read and understand the page, returning structured JSON. Pair with confidence scores, validation rules (survey number formats) and human review of low-confidence pages. Template-based rules break on varied layouts.',
    options: {
      rules: { cost: 10, accuracy: 30, overEng: 0, note: 'Template OCR breaks on dozens of handwritten layouts.' },
      ml: { cost: 45, accuracy: 65, overEng: 20, note: 'Custom-trained extractors need thousands of labelled pages per layout.' },
      genai: { cost: 55, accuracy: 88, overEng: 10, note: 'Vision-language models read varied layouts into a JSON schema.' },
    },
  },
  {
    id: 'assistant',
    sector: 'Citizen Services Portal',
    title: 'Answer citizen questions about 40 welfare schemes',
    brief: 'Citizens ask about eligibility, documents and deadlines for 40 schemes, in Hindi and English, via chat. Answers must reflect the latest guidelines (updated monthly) and cite the source so call-centre staff can verify.',
    facts: [
      { label: 'Input', value: 'Natural-language questions' },
      { label: 'Knowledge', value: '40 scheme guidelines, monthly updates' },
      { label: 'Need', value: 'Citations & freshness' },
    ],
    best: 'genai',
    why: 'Open-ended questions in two languages over changing documents → an LLM with RAG over the scheme guidelines, strict grounding and citations, plus “not found” handling and human hand-off. A scripted FAQ bot could be the non-AI baseline to beat.',
    options: {
      rules: { cost: 5, accuracy: 40, overEng: 0, note: 'A decision-tree FAQ bot can’t handle free-form questions.' },
      ml: { cost: 30, accuracy: 55, overEng: 20, note: 'An intent classifier maps to canned answers — rigid and quickly outdated.' },
      genai: { cost: 50, accuracy: 89, overEng: 10, note: 'LLM + RAG answers in Hindi & English with citations to current guidelines.' },
    },
  },
];

const CHOICES: { id: Choice; label: string; icon: typeof ListChecks; tone: string }[] = [
  { id: 'rules', label: 'Simple Rules / SQL', icon: ListChecks, tone: 'border-sky-400 bg-sky-50 dark:bg-sky-950/40' },
  { id: 'ml', label: 'Classical ML', icon: Table2, tone: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'genai', label: 'GenAI / LLM', icon: Sparkles, tone: 'border-rose-400 bg-rose-50 dark:bg-rose-950/40' },
];

function Bars({ e, highlight }: { e: OptionEval; highlight: boolean }) {
  const row = (label: string, v: number, good: 'high' | 'low') => {
    const tone = good === 'high' ? (v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-rose-500') : v <= 20 ? 'bg-emerald-500' : v <= 55 ? 'bg-amber-500' : 'bg-rose-500';
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <span className="w-24 text-slate-500">{label}</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={cx('h-full rounded-full transition-all duration-700', tone)} style={{ width: `${v}%` }} />
        </div>
        <span className="w-7 text-right font-mono">{v}</span>
      </div>
    );
  };
  return (
    <div className={cx('space-y-1.5', !highlight && 'opacity-80')}>
      {row('Accuracy', e.accuracy, 'high')}
      {row('Cost', e.cost, 'low')}
      {row('Over-engineering', e.overEng, 'low')}
    </div>
  );
}

export default function Lab0Decision() {
  const [answers, setAnswers] = useLabData<Record<string, Choice>>('lab-0:answers', {});
  const [idx, setIdx] = useState(() => {
    const first = BRIEFS.findIndex((b) => !answers[b.id]);
    return first === -1 ? BRIEFS.length : first;
  });
  const done = idx >= BRIEFS.length;
  const b = BRIEFS[Math.min(idx, BRIEFS.length - 1)];
  const picked = answers[b.id];
  const answeredCount = Object.keys(answers).filter((k) => BRIEFS.some((x) => x.id === k)).length;
  const correct = BRIEFS.filter((x) => answers[x.id] === x.best).length;
  const overEngPicks = BRIEFS.filter((x) => answers[x.id] && answers[x.id] !== x.best && x.options[answers[x.id]].overEng >= 60).length;
  const underPicks = BRIEFS.filter((x) => answers[x.id] && answers[x.id] !== x.best && x.options[answers[x.id]].overEng < 60).length;

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are the AI Program Manager reviewing 10 project proposals. For each, choose the <strong>simplest technology that will actually work</strong>. You’ll see how your choice compares on accuracy, running cost and over-engineering risk.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={(answeredCount / BRIEFS.length) * 100} />
          <span className="shrink-0 text-xs font-semibold text-slate-500">
            {answeredCount}/{BRIEFS.length} briefs · {correct} optimal
          </span>
        </div>
      </Card>

      {!done ? (
        <div key={b.id} className="grid animate-fade-in gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Building2 className="h-3.5 w-3.5" /> Brief {idx + 1} of {BRIEFS.length} · {b.sector}
            </div>
            <h2 className="mt-1 text-xl font-bold">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{b.brief}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {b.facts.map((f) => (
                <div key={f.label} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800/60">
                  <div className="font-semibold text-slate-500">{f.label}</div>
                  <div className="font-medium">{f.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm font-semibold">Which technology do we actually need?</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {CHOICES.map((c) => {
                const isPicked = picked === c.id;
                const isBest = b.best === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    disabled={!!picked}
                    onClick={() => setAnswers({ ...answers, [b.id]: c.id })}
                    className={cx(
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-semibold transition',
                      !picked && 'border-slate-200 hover:border-indigo-400 hover:shadow dark:border-slate-700',
                      picked && isBest && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
                      picked && isPicked && !isBest && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40',
                      picked && !isPicked && !isBest && 'border-slate-200 opacity-50 dark:border-slate-800',
                    )}
                  >
                    <c.icon className="h-5 w-5" />
                    {c.label}
                    {picked && isBest && <Badge tone="green">optimal</Badge>}
                    {picked && isPicked && !isBest && <Badge tone="red">your pick</Badge>}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className={cx(!picked && 'flex items-center justify-center')}>
            {!picked ? (
              <div className="text-center text-sm text-slate-500">
                <Gauge className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                Make your call to see the cost, accuracy and over-engineering fallout.
              </div>
            ) : (
              <div className="animate-fade-in space-y-4">
                <div className={cx('flex items-center gap-2 text-lg font-bold', picked === b.best ? 'text-emerald-600' : 'text-rose-600')}>
                  {picked === b.best ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {picked === b.best ? 'Spot on.' : `Better choice: ${CHOICES.find((c) => c.id === b.best)!.label}`}
                </div>
                {CHOICES.map((c) => (
                  <div key={c.id} className={cx('rounded-xl border p-3', c.id === picked ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-800', c.id === b.best && 'ring-2 ring-emerald-400')}>
                    <div className="mb-1.5 flex items-center justify-between text-sm font-semibold">
                      <span className="flex items-center gap-1.5">
                        <c.icon className="h-4 w-4" /> {c.label}
                      </span>
                      {c.id === picked && <Badge tone="indigo">you</Badge>}
                    </div>
                    <Bars e={b.options[c.id]} highlight={c.id === picked || c.id === b.best} />
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{b.options[c.id].note}</p>
                  </div>
                ))}
                <Callout tone="tip" title="Chief AI PM reasoning">
                  {b.why}
                </Callout>
                <Button onClick={() => setIdx(idx + 1)} className="w-full">
                  {idx === BRIEFS.length - 1 ? 'See my results' : 'Next brief'} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card className="animate-fade-in">
          <div className="flex flex-wrap items-center gap-4">
            <Trophy className="h-10 w-10 text-amber-500" />
            <div>
              <div className="text-2xl font-extrabold">
                {correct}/{BRIEFS.length} optimal decisions
              </div>
              <div className="text-sm text-slate-500">
                {overEngPicks} over-engineered · {underPicks} under-powered choices
              </div>
            </div>
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => {
                setAnswers({});
                setIdx(0);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Play again
            </Button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {BRIEFS.map((x, i) => {
              const a = answers[x.id];
              return (
                <button type="button" key={x.id} onClick={() => setIdx(i)} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-sm hover:border-indigo-400 dark:border-slate-800">
                  {a === x.best ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                  <span className="flex-1 truncate">{x.title}</span>
                  <span className="text-[11px] text-slate-500">
                    {a ? CHOICES.find((c) => c.id === a)!.label : '—'} {a !== x.best && `→ ${CHOICES.find((c) => c.id === x.best)!.label}`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Callout tone={overEngPicks > underPicks ? 'warn' : 'info'} title="Your decision profile">
              {overEngPicks > underPicks
                ? 'You lean towards over-engineering — reaching for GenAI or ML where rules or SQL would be exact, cheaper and auditable. In real programs, this is the most common and most expensive mistake.'
                : underPicks > 0
                  ? 'You sometimes under-power problems with rules where messy language or patterns genuinely need ML or GenAI. Cheap solutions that don’t work are not cheap.'
                  : 'Perfectly calibrated: you match technology to the problem, not the hype. That is the core skill of an AI PM.'}
            </Callout>
          </div>
        </Card>
      )}

      <Missions
        labId="lab-0"
        score={answeredCount ? (correct / BRIEFS.length) * 100 : 0}
        missions={[
          { id: 'all', label: 'Review all 10 project briefs', done: answeredCount >= BRIEFS.length },
          { id: 'seven', label: 'Make at least 7 optimal technology decisions', done: correct >= 7 },
          { id: 'rules', label: 'Correctly spot all 3 problems that only need Rules / SQL', done: ['pension', 'duplicates', 'mis'].every((id) => answers[id] === 'rules') },
          { id: 'perfect', label: 'Finish with zero over-engineered choices', done: answeredCount >= BRIEFS.length && overEngPicks === 0 },
        ]}
      />
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Database className="h-3.5 w-3.5" /> Your answers are saved in this browser, so you can come back and review them.
      </p>
    </div>
  );
}
