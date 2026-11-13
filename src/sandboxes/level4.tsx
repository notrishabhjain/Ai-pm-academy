import { useMemo, useState } from 'react';
import { Bot, MessageSquare, Play, RotateCcw, ChevronRight, Wrench, AlertTriangle, CheckCircle2, Plug, Award } from 'lucide-react';
import { Badge, Button, Callout, Card, HBar, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { inr, inrShort, num } from '../lib/format';
import { rng } from '../lib/math';

/* ------------------------------------------------------------------ */
/* Lesson 4.1 — Agent loop                                             */
/* ------------------------------------------------------------------ */

interface AgentStep {
  thought: string;
  action: string;
  observation: string;
  risky?: boolean;
  done?: boolean;
}

function agentSteps(messy: boolean, stopCheck: boolean): AgentStep[] {
  const s: AgentStep[] = [
    { thought: 'I need the current booking before I can move it.', action: 'get_appointment({"applicant_id": "AP-55120"})', observation: '{"id": "APT-88213", "slot": "Mon 10 Nov 15:00", "centre": "PSK Pune"}' },
    { thought: 'Find morning slots next week at the same centre.', action: 'list_slots({"centre": "PSK Pune", "week": "2026-11-16", "period": "morning"})', observation: '{"slots": ["Tue 09:30", "Thu 10:15"]}' },
    { thought: 'Book the earliest morning slot.', action: 'reschedule({"id": "APT-88213", "slot": "Tue 09:30"})', observation: messy ? '{"error": "SLOT_TAKEN"}' : '{"status": "CONFIRMED", "slot": "Tue 09:30"}' },
  ];
  if (messy) s.push({ thought: 'Tuesday was just taken. Try the next morning slot.', action: 'reschedule({"id": "APT-88213", "slot": "Thu 10:15"})', observation: '{"status": "CONFIRMED", "slot": "Thu 10:15"}' });
  s.push({ thought: 'Booking confirmed. Send the user a confirmation.', action: 'send_confirmation({"applicant_id": "AP-55120"})', observation: '{"sent": true}', done: stopCheck });
  if (!stopCheck) {
    for (let i = 0; i < 8; i++) {
      s.push(
        i % 2 === 0
          ? { thought: 'Maybe an even earlier morning slot opened up — let me check again.', action: 'list_slots({"centre": "PSK Pune", "week": "2026-11-16", "period": "morning"})', observation: '{"slots": ["Wed 09:00"]}' }
          : { thought: 'Wednesday is earlier! Move the booking again to optimise.', action: 'reschedule({"id": "APT-88213", "slot": "Wed 09:00"})', observation: '{"status": "CONFIRMED", "slot": "Wed 09:00"}  ← user gets another SMS', risky: true },
      );
    }
  }
  return s;
}

export function AgentLoopSandbox() {
  const [mode, setMode] = useState<'chatbot' | 'agent'>('agent');
  const [messy, setMessy] = useState(true);
  const [stopCheck, setStopCheck] = useState(true);
  const [maxIter, setMaxIter] = useState(8);
  const [shown, setShown] = useState(0);
  const steps = agentSteps(messy, stopCheck);
  const doneIdx = steps.findIndex((s) => s.done);
  const limit = Math.min(maxIter, doneIdx >= 0 ? doneIdx + 1 : steps.length);
  const visible = steps.slice(0, Math.min(shown, limit));
  const finished = shown >= limit;
  const goalMet = visible.some((s) => s.observation.includes('CONFIRMED'));
  const tokens = visible.length * 1350;
  const reset = () => setShown(0);

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
        User: <strong>“Move my passport appointment to next week, a morning slot please.”</strong>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
          options={[
            { value: 'chatbot', label: <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Chatbot</span> },
            { value: 'agent', label: <span className="flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> Agent</span> },
          ]}
        />
      </div>
      {mode === 'chatbot' ? (
        <Card className="space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500">Chatbot reply (1 LLM call, ~600 tokens)</div>
          <p className="text-sm">
            To reschedule, log in to the Passport Seva portal → “View saved/submitted applications” → “Reschedule appointment”, then choose an available morning slot next week. You can reschedule up to two times within one year.
          </p>
          <Callout tone="info">Helpful and cheap — but the citizen still does all the work, and the chatbot can’t see real availability. Switch to “Agent” to see the difference.</Callout>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
            <Toggle label="Messy real world (slot gets taken)" checked={messy} onChange={(v) => { setMessy(v); reset(); }} />
            <Toggle label="Stop condition: halt when goal is met" checked={stopCheck} onChange={(v) => { setStopCheck(v); reset(); }} hint="Without it the agent keeps “optimising”" />
            <Slider label="Max iterations (safety cap)" value={maxIter} min={1} max={12} onChange={(v) => { setMaxIter(v); reset(); }} />
            <div className="flex gap-2">
              <Button size="sm" disabled={finished} onClick={() => setShown(shown + 1)}>
                <ChevronRight className="h-3.5 w-3.5" /> Next step
              </Button>
              <Button size="sm" variant="secondary" disabled={finished} onClick={() => setShown(limit)}>
                <Play className="h-3.5 w-3.5" /> Run all
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Iterations" value={`${visible.length}/${maxIter}`} />
              <Stat label="Tokens" value={num(tokens)} sub={`≈ ${inr((tokens / 1e6) * 6 * 88)}`} />
            </div>
          </Card>
          <div className="space-y-2">
            {visible.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Press “Next step” to watch the agent think, act and observe.</p>}
            {visible.map((s, i) => (
              <div key={i} className={cx('animate-fade-in rounded-xl border p-3 text-xs', s.risky ? 'border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800')}>
                <div className="mb-1 font-bold text-slate-500">Iteration {i + 1}</div>
                <div><span className="font-semibold text-violet-600">Thought:</span> {s.thought}</div>
                <div className="mt-1 font-mono"><span className="font-sans font-semibold text-indigo-600">Action:</span> {s.action}</div>
                <div className="mt-1 font-mono"><span className="font-sans font-semibold text-emerald-600">Observation:</span> {s.observation}</div>
              </div>
            ))}
            {finished && (
              <Callout tone={stopCheck && goalMet ? 'success' : !goalMet ? 'warn' : 'danger'} title={stopCheck && goalMet ? 'Goal met — agent stopped' : !goalMet ? 'Hit the iteration cap before finishing' : 'Runaway loop stopped only by the cap'}>
                {stopCheck && goalMet
                  ? `The agent adapted to a real-world failure and stopped once the booking was confirmed — ${visible.length} iterations, ~${num(tokens)} tokens.`
                  : !goalMet
                    ? 'The safety cap stopped the agent before it finished. Good: it did not run forever. Next: escalate to a human with a summary of what was tried.'
                    : 'Without a stop condition the agent kept “optimising”, rescheduling the citizen repeatedly (each a real side effect and SMS) until the max-iteration cap fired. Caps, stop checks and approval for side-effecting actions are essential.'}
              </Callout>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 4.2 — Tool calling + MCP                                     */
/* ------------------------------------------------------------------ */

const TOOLS = [
  { id: 'status', name: 'get_application_status', desc: 'Look up an application’s status by ID' },
  { id: 'book', name: 'book_appointment', desc: 'Book a slot at a Passport Seva Kendra' },
  { id: 'fee', name: 'calculate_fee', desc: 'Compute the exact fee for a passport service' },
  { id: 'policy', name: 'search_policy', desc: 'Search official rules & FAQs' },
] as const;
type ToolId = (typeof TOOLS)[number]['id'];

const REQUESTS: { text: string; tool: ToolId | null; args?: Record<string, unknown>; noToolReply: string; missing?: string }[] = [
  { text: 'What’s the status of APL-2026-004512?', tool: 'status', args: { application_id: 'APL-2026-004512' }, noToolReply: 'I can’t look up live application data. Please check the portal under “Track Application Status”.' },
  { text: 'Book me a passport appointment in Pune next Tuesday morning.', tool: 'book', args: { centre: 'PSK Pune', date: '2026-11-17', period: 'morning' }, noToolReply: 'Here’s how you can book an appointment yourself on the portal… (no action taken)' },
  { text: 'How much is the fee for a 36-page tatkal passport?', tool: 'fee', args: { service: 'fresh_passport', pages: 36, tatkal: true }, noToolReply: 'The fee is around ₹3,000. ⚠ Guessed from training data — may be outdated or wrong.' },
  { text: 'Can I carry a photocopy instead of my original Aadhaar?', tool: 'policy', args: { query: 'photocopy vs original Aadhaar document verification PSK' }, noToolReply: 'Usually originals are required. ⚠ Not verified against current official rules.' },
  { text: 'What’s the status of my application?', tool: 'status', noToolReply: 'I can’t look that up — please check the portal.', missing: 'application_id' },
  { text: 'Thanks, that was really helpful!', tool: null, noToolReply: 'You’re welcome! Anything else I can help with?' },
];

export function ToolCallingSandbox() {
  const [enabled, setEnabled] = useState<Record<ToolId, boolean>>({ status: true, book: true, fee: true, policy: true });
  const [ri, setRi] = useState(0);
  const [apps, setApps] = useState(4);
  const [tools, setTools] = useState(8);
  const req = REQUESTS[ri];
  const toolAvailable = req.tool ? enabled[req.tool] : false;
  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const tool = TOOLS.find((t) => t.id === req.tool);

  let outcome: { kind: 'call' | 'ask' | 'reply' | 'guess'; body: string };
  if (!req.tool) outcome = { kind: 'reply', body: req.noToolReply };
  else if (!toolAvailable) outcome = { kind: req.tool === 'fee' || req.tool === 'policy' ? 'guess' : 'reply', body: req.noToolReply };
  else if (req.missing) outcome = { kind: 'ask', body: `I can check that for you — could you share your application ID? (format APL-YYYY-NNNNNN)` };
  else outcome = { kind: 'call', body: JSON.stringify({ type: 'tool_use', name: tool!.name, input: req.args }, null, 2) };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="space-y-2 bg-slate-50 dark:bg-slate-950/40">
          <div className="text-xs font-bold uppercase text-slate-500">Tools offered to the model</div>
          {TOOLS.map((t) => (
            <Toggle key={t.id} label={t.name} hint={t.desc} checked={enabled[t.id]} onChange={(v) => setEnabled({ ...enabled, [t.id]: v })} />
          ))}
          <p className="pt-1 text-[11px] text-slate-500">Tool definitions add ~{enabledCount * 120} prompt tokens to every call.</p>
        </Card>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {REQUESTS.map((r, i) => (
              <button type="button" key={i} onClick={() => setRi(i)} className={cx('rounded-full border px-3 py-1 text-xs', ri === i ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}>
                {r.text}
              </button>
            ))}
          </div>
          <div className="rounded-xl border-2 border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <Wrench className="h-3.5 w-3.5" /> Model output
              {outcome.kind === 'call' && <Badge tone="indigo">tool call</Badge>}
              {outcome.kind === 'ask' && <Badge tone="green">asks for missing info</Badge>}
              {outcome.kind === 'reply' && <Badge tone="slate">plain reply</Badge>}
              {outcome.kind === 'guess' && <Badge tone="red">ungrounded guess</Badge>}
            </div>
            {outcome.kind === 'call' ? <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">{outcome.body}</pre> : <p className="text-sm">{outcome.body}</p>}
          </div>
          <Callout tone={outcome.kind === 'guess' ? 'danger' : outcome.kind === 'ask' ? 'success' : 'info'}>
            {outcome.kind === 'call' && 'The model did not touch any system — it produced a structured request. Your code validates the arguments, checks the citizen’s permissions, executes it and returns the result.'}
            {outcome.kind === 'ask' && 'A well-designed tool + instructions make the model ask for the missing ID instead of inventing one. Invented arguments are a classic tool-calling failure.'}
            {outcome.kind === 'reply' && (req.tool ? 'The right tool is switched off, so the model can only explain — no action, no live data.' : 'No tool needed — the model just replies. Good tool descriptions help the model know when NOT to call tools.')}
            {outcome.kind === 'guess' && 'Without the calculation or policy tool, the model falls back on training data — a confident number that may be outdated. Exact values should come from tools.'}
          </Callout>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Plug className="h-4 w-4 text-indigo-500" /> Why MCP matters: integrations to build and maintain
        </div>
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
            <Slider label="AI apps / agents in your organisation" value={apps} min={1} max={12} onChange={setApps} />
            <Slider label="Tools & data sources" value={tools} min={1} max={25} onChange={setTools} />
          </Card>
          <div className="space-y-2">
            <HBar label="Custom wiring (N × M)" value={apps * tools} max={300} right={String(apps * tools)} color="bg-rose-500" />
            <HBar label="With MCP (N + M)" value={apps + tools} max={300} right={String(apps + tools)} color="bg-emerald-500" />
            <p className="text-xs text-slate-500">
              Each AI app implements one MCP client; each tool exposes one MCP server. Saving: <strong>{apps * tools - (apps + tools)}</strong> integrations — but every MCP server still needs security review, least-privilege scopes and an owner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 4.3 — Patterns                                               */
/* ------------------------------------------------------------------ */

type Pattern = 'single' | 'router' | 'sequential' | 'orchestrator';
const TASKS = {
  faq: { label: 'FAQ bot for one scheme', best: 'single' as Pattern },
  helpdesk: { label: 'Helpdesk across 6 departments', best: 'router' as Pattern },
  letter: { label: 'Extract → check → draft → translate letter', best: 'sequential' as Pattern },
  research: { label: 'Policy brief from 12 audit reports', best: 'orchestrator' as Pattern },
};
type TaskId = keyof typeof TASKS;
const METRICS: Record<TaskId, Record<Pattern, [number, number, number, number]>> = {
  // quality, latency (s), cost multiple, debuggability
  faq: { single: [92, 1.5, 1, 95], router: [92, 2.1, 1.3, 85], sequential: [90, 4, 2.5, 75], orchestrator: [91, 9, 6, 45] },
  helpdesk: { single: [74, 2.5, 1.4, 70], router: [91, 2.4, 1.2, 85], sequential: [80, 6, 3, 70], orchestrator: [88, 11, 7, 40] },
  letter: { single: [78, 4, 1.5, 60], router: [79, 4.5, 1.7, 65], sequential: [93, 6, 2.2, 90], orchestrator: [90, 12, 5, 50] },
  research: { single: [61, 40, 3, 55], router: [63, 42, 3.2, 55], sequential: [80, 70, 5, 70], orchestrator: [92, 25, 8, 55] },
};

function PatternDiagram({ p }: { p: Pattern }) {
  const box = (label: string, cls = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200') => <span className={cx('rounded-lg px-2 py-1 text-[11px] font-semibold', cls)}>{label}</span>;
  const arrow = <span className="text-slate-400">→</span>;
  if (p === 'single') return <div className="flex items-center justify-center gap-2">{box('User')}{arrow}{box('Agent + tools', 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200')}{arrow}{box('Answer')}</div>;
  if (p === 'router')
    return (
      <div className="flex items-center justify-center gap-2">
        {box('User')}
        {arrow}
        {box('Router', 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200')}
        {arrow}
        <div className="flex flex-col gap-1">{['Pensions', 'Passports', 'Land', '…'].map((x) => <span key={x}>{box(x, 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200')}</span>)}</div>
      </div>
    );
  if (p === 'sequential')
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {['Extract', 'Check rules', 'Draft', 'Translate'].map((x, i) => (
          <span key={x} className="flex items-center gap-2">
            {box(x, 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200')}
            {i < 3 && arrow}
          </span>
        ))}
      </div>
    );
  return (
    <div className="flex items-center justify-center gap-2">
      {box('Orchestrator', 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200')}
      {arrow}
      <div className="grid grid-cols-3 gap-1">{Array.from({ length: 6 }, (_, i) => <span key={i}>{box(`W${i + 1}`, 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200')}</span>)}</div>
      {arrow}
      {box('Synthesise')}
    </div>
  );
}

export function PatternsSandbox() {
  const [task, setTask] = useState<TaskId>('helpdesk');
  const [p, setP] = useState<Pattern>('single');
  const [q, lat, cost, dbg] = METRICS[task][p];
  const best = TASKS[task].best;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TASKS) as TaskId[]).map((t) => (
          <button type="button" key={t} onClick={() => setTask(t)} className={cx('rounded-full border px-3 py-1 text-xs font-medium', task === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}>
            {TASKS[t].label}
          </button>
        ))}
      </div>
      <Segmented
        value={p}
        onChange={setP}
        options={[
          { value: 'single', label: 'Single agent' },
          { value: 'router', label: 'Router' },
          { value: 'sequential', label: 'Sequential' },
          { value: 'orchestrator', label: 'Orchestrator–workers' },
        ]}
      />
      <Card className="bg-slate-50 py-6 dark:bg-slate-950/40">
        <PatternDiagram p={p} />
      </Card>
      <div className="grid gap-2 sm:grid-cols-4">
        <Stat label="Quality (golden set)" value={`${q}%`} tone={q >= 90 ? 'text-emerald-600' : q >= 80 ? 'text-amber-600' : 'text-rose-600'} />
        <Stat label="Latency" value={`${lat}s`} />
        <Stat label="Cost vs single" value={`${cost}×`} tone={cost > 4 ? 'text-rose-600' : undefined} />
        <Stat label="Debuggability" value={`${dbg}/100`} />
      </div>
      <Callout tone={p === best ? 'success' : 'tip'} title={p === best ? 'Pragmatic choice' : `An architect would likely pick: ${best}`}>
        {p === best ? (
          <span className="inline-flex items-center gap-1"><Award className="h-4 w-4" /> Best balance of quality, cost and debuggability for this task.</span>
        ) : (
          <>
            {task === 'faq' && 'One scheme, one knowledge base: a single agent is simplest and just as accurate. Extra agents only add cost.'}
            {task === 'helpdesk' && 'Six departments with different tools and policies → a router sends each request to a focused specialist, keeping prompts small and accurate.'}
            {task === 'letter' && 'A fixed, well-understood process → a sequential chain with validation between steps is predictable and easy to test.'}
            {task === 'research' && 'Twelve long reports exceed what one pass can handle well → an orchestrator fans out to parallel workers and synthesises.'}
          </>
        )}
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 4.4 — Threshold economics                                     */
/* ------------------------------------------------------------------ */

function makeCases(calibration: number) {
  const r = rng(99);
  return Array.from({ length: 300 }, () => {
    const correct = r() < 0.86;
    const goodConf = correct ? 0.72 + 0.27 * Math.sqrt(r()) : 0.4 + 0.42 * r();
    const badConf = 0.7 + 0.29 * Math.sqrt(r());
    const conf = r() < calibration / 100 ? goodConf : correct ? goodConf : badConf;
    return { correct, conf: Math.min(0.995, conf) };
  });
}

export function ThresholdSandbox() {
  const [t, setT] = useState(0.85);
  const [calib, setCalib] = useState(85);
  const [errCost, setErrCost] = useState(8000);
  const cases = useMemo(() => makeCases(calib), [calib]);
  const evalAt = (th: number) => {
    const auto = cases.filter((c) => c.conf >= th);
    const queue = cases.filter((c) => c.conf < th);
    const slipped = auto.filter((c) => !c.correct).length;
    const missedByHumans = Math.round(queue.filter((c) => !c.correct).length * 0.05);
    const reviewMins = queue.length * 4;
    const reviewCost = (reviewMins / 60) * 600;
    const total = reviewCost + (slipped + missedByHumans) * errCost;
    return { auto: auto.length, queue: queue.length, slipped, missedByHumans, reviewMins, reviewCost, total };
  };
  const cur = evalAt(t);
  const sweep = Array.from({ length: 50 }, (_, i) => 0.5 + i * 0.01).map((th) => ({ th, ...evalAt(th) }));
  const best = sweep.reduce((b, s) => (s.total < b.total ? s : b), sweep[0]);
  const bins = Array.from({ length: 20 }, (_, i) => {
    const lo = 0.4 + i * 0.03;
    const inBin = cases.filter((c) => c.conf >= lo && c.conf < lo + 0.03);
    return { lo, ok: inBin.filter((c) => c.correct).length, bad: inBin.filter((c) => !c.correct).length };
  });
  const maxBin = Math.max(...bins.map((b) => b.ok + b.bad));

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
        <Slider label="Auto-approve threshold" value={t} min={0.5} max={0.99} step={0.01} onChange={setT} format={(v) => v.toFixed(2)} />
        <Slider label="Confidence calibration quality" value={calib} min={0} max={100} onChange={setCalib} format={(v) => (v > 80 ? 'Well calibrated' : v > 40 ? 'So-so' : 'Overconfident')} />
        <Slider label="Cost of one wrong auto-approval" value={errCost} min={500} max={50000} step={500} onChange={setErrCost} format={inr} hint="Rework, appeals, citizen harm, reputational risk" />
        <p className="text-[11px] text-slate-500">Human review: 4 min/case at ₹600/hour; reviewers catch 95% of errors they see.</p>
      </Card>
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-1 text-xs font-semibold text-slate-500">AI confidence distribution (green = AI right, red = AI wrong) · dashed line = threshold</div>
          <div className="relative flex h-32 items-end gap-0.5">
            {bins.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end" title={`${b.lo.toFixed(2)}–${(b.lo + 0.03).toFixed(2)}: ${b.ok} right, ${b.bad} wrong`}>
                <div className="bg-rose-500" style={{ height: `${(b.bad / maxBin) * 120}px` }} />
                <div className="bg-emerald-500" style={{ height: `${(b.ok / maxBin) * 120}px` }} />
              </div>
            ))}
            <div className="absolute inset-y-0 border-l-2 border-dashed border-indigo-600" style={{ left: `${Math.max(0, Math.min(100, ((t - 0.4) / 0.6) * 100))}%` }}>
              <span className="ml-1 rounded bg-indigo-600 px-1 text-[10px] font-bold text-white">{t.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>0.40</span>
            <span>human review ← → auto-approve</span>
            <span>1.00</span>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <Stat label="Auto-approved" value={cur.auto} sub="of 300 cases" />
          <Stat label="Errors slipped through" value={cur.slipped} tone={cur.slipped > 5 ? 'text-rose-600' : 'text-emerald-600'} />
          <Stat label="Human queue" value={cur.queue} sub={`${num(cur.reviewMins / 60, 1)} reviewer-hours`} />
          <Stat label="Total cost" value={inrShort(cur.total)} sub="review + error cost" />
        </div>
        <Callout tone={Math.abs(best.th - t) < 0.03 ? 'success' : 'tip'} title={`Lowest total cost at threshold ≈ ${best.th.toFixed(2)} (${inrShort(best.total)})`}>
          {calib < 40
            ? 'With an overconfident model, wrong answers carry high confidence too — no threshold separates them cleanly. Fix calibration (better signals, rule checks) before trusting auto-approval.'
            : 'The right threshold is a business decision: it balances reviewer cost against the cost of a wrong automated decision. Raise the error cost and watch the optimum move right.'}
          <span className="mt-1 flex items-center gap-1 text-xs">
            {cur.slipped === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} At {t.toFixed(2)}: {cur.slipped} wrong decisions reach citizens automatically per 300 cases.
          </span>
        </Callout>
      </div>
    </div>
  );
}
