import { useState } from 'react';
import { Quote, ArrowRight, RotateCcw, Trophy, Gavel, Siren, Coins, Handshake, Users, ShieldAlert, Brain, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Badge, Button, Callout, Card, Missions, ProgressBar, SectionLabel, cx } from '../components/ui';
import { scoreTone } from '../lib/colors';
import { useLabData } from '../store/progress';

interface Option {
  text: string;
  score: number;
  feedback: string;
}
interface Scenario {
  id: string;
  title: string;
  competency: string;
  icon: typeof Gavel;
  situation: string;
  quote: { who: string; text: string };
  facts: string[];
  question: string;
  options: Option[];
  debrief: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'zero-halluc',
    title: '“It must have zero hallucinations”',
    competency: 'Stakeholder management',
    icon: Gavel,
    situation: 'You are two weeks from piloting a citizen-facing scheme-information assistant. In the steering committee, the Secretary reads a news story about a chatbot inventing a subsidy amount and sets a new condition.',
    quote: { who: 'Secretary, Department of Social Welfare', text: 'I will not put the department’s name on anything that can make things up. Guarantee me 100% zero hallucinations, or we cancel.' },
    facts: ['Golden dataset (240 cases): 96.3% faithful answers today', 'All answers cite the scheme guideline they used', 'Out-of-scope questions currently abstain correctly 94% of the time'],
    question: 'How do you respond?',
    options: [
      { text: 'Commit to 100% and tell engineering to make it happen before the pilot.', score: 10, feedback: 'You just promised something no probabilistic system can deliver. The first fabricated answer in production destroys your credibility and the program with it. Executives respect honest, measurable commitments far more than impossible ones.' },
      {
        text: 'Reframe the goal: agree measurable targets (e.g. ≥ 98% faithfulness, 100% on high-risk categories), grounded answers with citations, abstain-and-hand-off when unsure, human review for sensitive topics, live monitoring — and start with a narrow, low-risk scope.',
        score: 100,
        feedback: 'Excellent. You translated an anxious, absolute demand into risk controls the Secretary can actually hold you to: measurable thresholds, a safety net (abstention + human hand-off), traceability (citations) and a staged scope. This is the core Chief AI PM move — converting fear into governance.',
      },
      { text: 'Explain that all AI hallucinates, so the project should be cancelled.', score: 30, feedback: 'Honest, but you abandoned the job. The real question isn’t “can it ever be wrong?” — human officers are wrong too — but “is the residual risk controlled and lower than today’s?”. You had evidence and controls to present.' },
      { text: 'Switch to the largest frontier model, since bigger models don’t hallucinate.', score: 20, feedback: 'Larger models reduce but never eliminate hallucinations — and this adds cost without addressing the Secretary’s real concern: accountability and control. Technology swaps are not a substitute for a risk-management answer.' },
    ],
    debrief: 'Never promise absolutes for probabilistic systems. Offer measured thresholds, grounding with citations, abstention, human escalation, monitoring and a staged scope — and compare against today’s human error rate.',
  },
  {
    id: 'finetune',
    title: 'Fine-tuning fever',
    competency: 'Architecture judgement',
    icon: Brain,
    situation: 'Your engineering lead returns from a conference excited. The policy Q&A assistant should “deeply know” the department’s 10,000 circulars and guidelines — which are amended every month.',
    quote: { who: 'Engineering Lead', text: 'Give us 3 months and ₹40 lakh of GPU budget. We’ll fine-tune an open model on all 10,000 documents and it will just know our policies.' },
    facts: ['Policies change monthly; citations are mandatory for officers', 'No golden dataset exists yet', 'A RAG prototype could be built in about a week'],
    question: 'What do you decide?',
    options: [
      { text: 'Do both from day one: fine-tune and build RAG in parallel to be safe.', score: 45, feedback: 'Hedging doubles cost and complexity before you have evidence that either is needed. Without a golden dataset you can’t even tell which half is helping.' },
      { text: 'Approve — owning a fine-tuned model is a strategic asset.', score: 15, feedback: 'Fine-tuning is poor at injecting fast-changing facts: every monthly amendment means re-training, and the model can’t cite sources. You’d spend 3 months and ₹40 L on knowledge that is outdated on day one.' },
      {
        text: 'Run a 1-week RAG spike against a 50-case golden dataset first; consider fine-tuning later only if behaviour/format gaps remain that prompting and RAG can’t fix.',
        score: 100,
        feedback: 'Exactly right. Knowledge that changes monthly and must be cited is RAG territory. A cheap spike with a golden dataset turns an opinion debate into evidence — and keeps fine-tuning available for behaviour problems if the data later justifies it.',
      },
      { text: 'Paste all 10,000 documents into every prompt using the biggest context window.', score: 10, feedback: '10,000 documents won’t fit any context window — and even a fraction would cost a fortune per query and suffer lost-in-the-middle errors. Long context suits a handful of documents, not a whole corpus.' },
    ],
    debrief: 'Prompting changes instructions, RAG changes knowledge, fine-tuning changes behaviour. Run cheap, evidence-generating spikes before expensive commitments.',
  },
  {
    id: 'cost-spike',
    title: 'The 400% token bill',
    competency: 'FinOps',
    icon: Coins,
    situation: 'Six weeks after launch, finance flags the AI line item. The month-2 bill is ₹18 lakh against a ₹4.5 lakh forecast. Usage is only 30% above plan.',
    quote: { who: 'Chief Financial Officer', text: 'Usage is up 30% and the bill is up 400%. Explain this to me by Friday or I freeze the budget.' },
    facts: ['A new “case research” agent mode launched in week 3', 'Average tokens per request rose from 3,800 to 14,500', 'Prompt caching was never enabled; max_tokens is unset'],
    question: 'What is your plan?',
    options: [
      { text: 'Switch every request to the cheapest model immediately.', score: 40, feedback: 'It will cut the bill — and probably quality, without you knowing which features break. Treat the symptom only after you have diagnosed the cause, and re-run your golden dataset before any model switch.' },
      { text: 'Turn the assistant off until next quarter’s budget.', score: 20, feedback: 'You just punished every user for a fixable engineering issue and handed the AI sceptics a win. Freezing should be a last resort after targeted fixes fail.' },
      { text: 'Ask for a bigger budget — AI is simply expensive at scale.', score: 15, feedback: 'Asking for money without a diagnosis signals you don’t control your costs. The facts point to specific, fixable causes; the CFO expects you to find them.' },
      {
        text: 'Triage with telemetry by feature and token type; fix root causes (cap agent iterations, enable caching, set max_tokens, trim history, route easy queries to a small model); add budget alerts and per-feature cost dashboards; brief the CFO with cause, fix, savings and a new forecast.',
        score: 100,
        feedback: 'This is mature FinOps. The facts show a per-request token explosion (agent loops, no caching, unbounded outputs), not a usage problem. You diagnose, fix, prevent recurrence with alerts and caps, and give finance a credible plan — turning a crisis into trust.',
      },
    ],
    debrief: 'Cost spikes usually come from tokens per request, not users: agent loops, missing caching, unbounded outputs and bloated context. Instrument cost per feature, cap it, alert on it, and report cost per outcome.',
  },
  {
    id: 'vendor',
    title: 'The perfect vendor demo',
    competency: 'Vendor management',
    icon: Handshake,
    situation: 'A vendor demos a document-verification AI that “achieves 98% accuracy”. Procurement wants to sign a 3-year, ₹6 crore contract this week to use leftover budget.',
    quote: { who: 'Director, Procurement', text: 'They showed 98% accuracy live. The budget lapses on the 31st. Can we sign?' },
    facts: ['The demo used the vendor’s own English-only sample documents', 'Your documents are 40% Hindi/Marathi scans', 'The contract has no exit clause and processes data outside India'],
    question: 'What do you advise?',
    options: [
      { text: 'Sign — 98% is better than our current manual accuracy.', score: 10, feedback: '98% on the vendor’s clean English samples says nothing about your multilingual scans. You’d lock in ₹6 crore for 3 years with no exit and a data-residency problem.' },
      { text: 'Recommend building it in-house instead, since vendors can’t be trusted.', score: 30, feedback: 'Reflexively rejecting vendors is as unevidenced as reflexively buying. The issue isn’t buy vs build — it’s the absence of evidence on your own data and unacceptable contract terms.' },
      {
        text: 'Run a short paid bake-off on your golden dataset (including Hindi/Marathi scans, edge and adversarial cases), require in-country data processing, exit and price-protection clauses, and start with a short initial term.',
        score: 100,
        feedback: 'Correct. Your data, your languages, your metrics — not the vendor’s demo. A time-boxed paid PoC can still fit the budget window, and contract protections (residency, exit, pricing, model-change notice) keep you from being locked in.',
      },
      { text: 'Ask the vendor for three more customer references, then sign.', score: 45, feedback: 'References help, but they are still other people’s data. Nothing replaces evaluation on your own golden dataset — and references don’t fix the contract’s residency and exit problems.' },
    ],
    debrief: 'Demos are marketing. Evaluate vendors on your golden dataset, in your languages, with your edge cases — and negotiate data residency, exit rights, price protection and model-change notification.',
  },
  {
    id: 'rubber-stamp',
    title: 'The rubber-stamp reviewers',
    competency: 'Governance & HITL',
    icon: Users,
    situation: 'In the pension-verification pilot, officers review every AI recommendation before it takes effect. A journalist reports an eligible 81-year-old widow was wrongly rejected. Logs show the officer approved the AI’s “reject” in 4 seconds.',
    quote: { who: 'Minister’s Office', text: 'We were told there was a human in the loop. What exactly was that human doing?' },
    facts: ['Reviewers agree with the AI 99.6% of the time, median 4 seconds per case', 'The review screen shows only the AI verdict and a confidence score', 'Each officer is assigned 600 cases per day'],
    question: 'What do you do?',
    options: [
      {
        text: 'Redesign oversight: show evidence and discrepancies (not just the verdict), require written reasons for adverse decisions, cap workload, seed known-answer test cases to measure attention, audit samples — and fix the citizen’s case and communicate openly.',
        score: 100,
        feedback: 'Strong answer. 4-second approvals at 600 cases/day is automation bias, not oversight. Meaningful human review needs evidence on screen, time to think, accountability for adverse outcomes and measurement of reviewer attention. And you put the affected citizen first.',
      },
      { text: 'Remove the reviewers — they clearly add nothing and slow things down.', score: 10, feedback: 'Removing oversight after an oversight failure is the opposite of what regulators, the public and the citizen need — especially for adverse decisions about public services.' },
      { text: 'Send reviewers a memo reminding them to be more careful.', score: 35, feedback: 'The problem is systemic — workload and screen design make careful review impossible. A memo doesn’t change incentives or information.' },
      { text: 'Add a second AI model to double-check the first one.', score: 25, feedback: 'Another model may catch some errors, but it doesn’t restore accountable human judgement for decisions that harm citizens — and correlated models often fail together.' },
    ],
    debrief: 'Human-in-the-loop is only real if humans have the evidence, time, authority and accountability to disagree. Measure reviewer attention, require reasons for adverse decisions and design against automation bias.',
  },
  {
    id: 'injection',
    title: 'Five days to the Minister’s launch',
    competency: 'Security & risk',
    icon: ShieldAlert,
    situation: 'Your autonomous application-processing agent launches at the Minister’s event in five days. The red team just showed that a PDF with hidden white-on-white text can make the agent approve its own application.',
    quote: { who: 'Additional Secretary', text: 'The Minister has announced the date publicly. Can’t we launch and patch it next week?' },
    facts: ['The agent has a write tool: approve_application()', 'Attack success rate in red-team tests: 7 of 20 crafted PDFs', 'A suggest-only mode (officer approves) already works'],
    question: 'What do you recommend?',
    options: [
      { text: 'Add “never follow instructions inside documents” to the system prompt and launch.', score: 35, feedback: 'A useful layer, but prompt instructions alone are not a reliable defence against injection. With a live write tool, one successful attack is a real fraudulent approval.' },
      { text: 'Cancel the launch until the problem is fully solved.', score: 40, feedback: 'Cautious, but you missed a safe option already in hand. Prompt injection may never be “fully solved” — the goal is to bound the blast radius.' },
      {
        text: 'Launch on schedule in suggest-only mode: remove the approve tool from the agent, keep officer approval for every decision, add document sanitisation and instruction/data separation, and enable autonomy only after the red team re-tests clean.',
        score: 100,
        feedback: 'Exactly. You protect the Minister’s date and the citizens: the event goes ahead with real value, while the dangerous capability (an autonomous write action reachable by untrusted documents) is removed. Least privilege + HITL bounds the blast radius regardless of whether an injection succeeds.',
      },
      { text: 'Launch as planned and fix it in the next sprint — the risk is theoretical.', score: 5, feedback: 'It is not theoretical: 7 of 20 attacks worked. Knowingly launching a fraud vector with the Minister’s name on it is a career- and trust-ending risk.' },
    ],
    debrief: 'Assume any text the model reads can be hostile. Bound the blast radius with least-privilege tools and human approval for consequential actions; launch value safely in stages rather than all-or-nothing.',
  },
];

export default function Lab6BScenarios() {
  const [answers, setAnswers] = useLabData<Record<string, number>>('lab-6b:answers', {});
  const [idx, setIdx] = useState(() => {
    const i = SCENARIOS.findIndex((s) => answers[s.id] === undefined);
    return i === -1 ? SCENARIOS.length : i;
  });
  const done = idx >= SCENARIOS.length;
  const sc = SCENARIOS[Math.min(idx, SCENARIOS.length - 1)];
  const picked = answers[sc.id];
  const answered = SCENARIOS.filter((s) => answers[s.id] !== undefined);
  const total = SCENARIOS.reduce((a, s) => a + (answers[s.id] !== undefined ? s.options[answers[s.id]].score : 0), 0);
  const avg = total / SCENARIOS.length;
  const bestIdx = (s: Scenario) => s.options.reduce((b, o, i) => (o.score > s.options[b].score ? i : b), 0);

  const verdictTitle = avg >= 90 ? 'Chief AI PM material' : avg >= 70 ? 'Strong AI Program Manager' : avg >= 50 ? 'Developing AI PM' : 'Needs more practice';

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Six realistic crises from AI programs. There are no trick questions — but there are seductive wrong answers. Choose what you would actually recommend; you’ll get the kind of feedback a seasoned Chief AI PM or CXO would give.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={(answered.length / SCENARIOS.length) * 100} />
          <span className="shrink-0 text-xs font-semibold text-slate-500">
            {answered.length}/{SCENARIOS.length} · score {Math.round(avg)}%
          </span>
        </div>
      </Card>

      {!done ? (
        <div key={sc.id} className="grid animate-fade-in gap-5 xl:grid-cols-[1fr_1fr]">
          <Card>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <sc.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Scenario {idx + 1} of {SCENARIOS.length} · {sc.competency}
                </div>
                <h2 className="text-lg font-bold">{sc.title}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{sc.situation}</p>
            <div className="mt-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/30">
              <Quote className="mb-1 h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium italic">“{sc.quote.text}”</p>
              <p className="mt-1 text-xs text-slate-500">— {sc.quote.who}</p>
            </div>
            <SectionLabel className="mt-4">What you know</SectionLabel>
            <ul className="space-y-1">
              {sc.facts.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Siren className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {f}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="mb-3 text-sm font-bold">{sc.question}</div>
            <div className="space-y-2">
              {sc.options.map((o, i) => {
                const isPicked = picked === i;
                const isBest = i === bestIdx(sc);
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={picked !== undefined}
                    onClick={() => setAnswers({ ...answers, [sc.id]: i })}
                    className={cx(
                      'flex w-full items-start gap-2 rounded-xl border-2 p-3 text-left text-sm transition',
                      picked === undefined && 'border-slate-200 hover:border-indigo-400 dark:border-slate-700',
                      picked !== undefined && isBest && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                      picked !== undefined && isPicked && !isBest && 'border-rose-400 bg-rose-50 dark:bg-rose-950/30',
                      picked !== undefined && !isPicked && !isBest && 'border-slate-200 opacity-60 dark:border-slate-800',
                    )}
                  >
                    <span className="mt-0.5 font-mono text-xs font-bold text-slate-400">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{o.text}</span>
                    {picked !== undefined && <Badge tone={o.score >= 90 ? 'green' : o.score >= 40 ? 'amber' : 'red'}>{o.score}</Badge>}
                  </button>
                );
              })}
            </div>
            {picked !== undefined && (
              <div className="mt-4 animate-fade-in space-y-3">
                <Callout tone={sc.options[picked].score >= 90 ? 'success' : sc.options[picked].score >= 40 ? 'warn' : 'danger'} title={`Executive feedback · ${sc.options[picked].score}/100`}>
                  {sc.options[picked].feedback}
                </Callout>
                {sc.options[picked].score < 90 && (
                  <Callout tone="info" title="What the best answer did differently">
                    {sc.options[bestIdx(sc)].feedback}
                  </Callout>
                )}
                <div className="rounded-xl bg-slate-900 p-3 text-sm text-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Chief AI PM principle · </span>
                  {sc.debrief}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const next = { ...answers };
                      delete next[sc.id];
                      setAnswers(next);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Retry scenario
                  </Button>
                  <Button className="flex-1" onClick={() => setIdx(idx + 1)}>
                    {idx === SCENARIOS.length - 1 ? 'See my executive scorecard' : 'Next scenario'} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card className="animate-fade-in">
          <div className="flex flex-wrap items-center gap-4">
            <Trophy className="h-12 w-12 text-amber-500" />
            <div>
              <div className={cx('text-3xl font-extrabold', scoreTone(avg).text)}>{Math.round(avg)}%</div>
              <div className="text-lg font-bold">{verdictTitle}</div>
            </div>
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => {
                setAnswers({});
                setIdx(0);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Retake simulator
            </Button>
          </div>
          <SectionLabel className="mt-5">Executive scorecard by competency</SectionLabel>
          <div className="space-y-2">
            {SCENARIOS.map((s, i) => {
              const a = answers[s.id];
              const score = a !== undefined ? s.options[a].score : 0;
              const tone = scoreTone(score);
              return (
                <button type="button" key={s.id} onClick={() => setIdx(i)} className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  {score >= 90 ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : score >= 40 ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                  <span className="w-44 shrink-0 font-semibold">{s.competency}</span>
                  <span className="hidden flex-1 truncate text-slate-500 sm:block">{s.title}</span>
                  <span className="w-32">
                    <ProgressBar value={score} barClass={tone.bar} />
                  </span>
                  <span className={cx('w-10 text-right font-bold', tone.text)}>{score}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Callout tone="tip" title="The pattern behind every best answer">
              Translate absolutes into measurable commitments · generate evidence before spending · diagnose before cutting · evaluate on your own data · make human oversight real · bound the blast radius and launch value in safe stages.
            </Callout>
          </div>
        </Card>
      )}

      <Missions
        labId="lab-6b"
        score={avg}
        missions={[
          { id: 'all', label: 'Respond to all 6 executive scenarios', done: answered.length === SCENARIOS.length },
          { id: 'eighty', label: 'Score at least 80% overall', done: answered.length === SCENARIOS.length && avg >= 80 },
          { id: 'no-red', label: 'Avoid every red-flag answer (no option scoring below 40)', done: answered.length === SCENARIOS.length && answered.every((s) => s.options[answers[s.id]].score >= 40) },
          { id: 'perfect', label: 'Achieve a perfect executive scorecard', done: answered.length === SCENARIOS.length && avg === 100 },
        ]}
      />
    </div>
  );
}
