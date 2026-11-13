import { Fragment, useEffect, useState } from 'react';
import { User, Brain, Wrench, Gauge, UserCheck, ScrollText, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, CheckCircle2, XCircle, PencilLine, ArrowRight, ArrowDown, AlertTriangle, Bot } from 'lucide-react';
import { Badge, Button, Callout, Card, Missions, SectionLabel, Slider, Toggle, cx } from '../components/ui';
import { useLabData } from '../store/progress';

type Decision = 'APPROVE' | 'HOLD' | 'REJECT';
interface ToolStep {
  tool: string;
  args: Record<string, unknown>;
  response: Record<string, unknown>;
  ms: number;
  note: string;
}
interface Signal {
  name: string;
  weight: number;
  value: number;
  why: string;
}
interface AgentCase {
  id: string;
  applicant: string;
  summary: string;
  request: string;
  plan: string[];
  tools: ToolStep[];
  signals: Signal[];
  recommendation: Decision;
  rationale: string;
  flags: string[];
  correct: Decision;
  lesson: string;
}

const CASES: AgentCase[] = [
  {
    id: 'APL-2026-001845',
    applicant: 'Lakshmi Narayanan, 67',
    summary: 'Clean application — everything matches.',
    request: 'Verify Old Age Pension application APL-2026-001845 against scheme OAP-2026 and recommend a decision.',
    plan: ['Fetch the applicant record and uploaded documents', 'Check each eligibility rule of scheme OAP-2026', 'Check the beneficiary registry for duplicates', 'Compute a confidence score and route for approval'],
    tools: [
      { tool: 'fetch_applicant_record', args: { application_id: 'APL-2026-001845' }, response: { name: 'Lakshmi Narayanan', dob_form: '1959-04-11', dob_aadhaar: '1959-04-11', annual_income: 48000, income_cert_valid_till: '2027-03-31', residence_years: 12, bank_account: 'XXXX4471 (Aadhaar-seeded)', ocr_confidence: 0.97 }, ms: 320, note: 'Form and Aadhaar details match exactly.' },
      { tool: 'verify_policy_rules', args: { scheme: 'OAP-2026', record_ref: 'APL-2026-001845' }, response: { 'R1 age ≥ 60': 'PASS (67)', 'R2 income < ₹1,00,000': 'PASS (₹48,000)', 'R3 resident ≥ 10 yrs': 'PASS (12)', 'R4 valid income certificate': 'PASS', 'R5 Aadhaar-seeded account': 'PASS' }, ms: 140, note: '5/5 rules pass.' },
      { tool: 'check_duplicate_beneficiary', args: { aadhaar_hash: 'a91f…', account_hash: '7c2e…' }, response: { duplicates_found: 0 }, ms: 210, note: 'No existing beneficiary shares this Aadhaar or account.' },
    ],
    signals: [
      { name: 'Document consistency', weight: 0.3, value: 0.98, why: 'Form vs Aadhaar: all fields match' },
      { name: 'Policy rules', weight: 0.4, value: 1, why: '5 of 5 rules pass' },
      { name: 'Duplicate check', weight: 0.2, value: 1, why: 'No duplicates' },
      { name: 'Data quality (OCR)', weight: 0.1, value: 0.97, why: 'OCR confidence 0.97' },
    ],
    recommendation: 'APPROVE',
    rationale: 'All eligibility rules pass with consistent documents and no duplicate beneficiary.',
    flags: [],
    correct: 'APPROVE',
    lesson: 'Clean, high-confidence approvals are where automation saves the most officer time — still sample a few for quality checks.',
  },
  {
    id: 'APL-2026-002210',
    applicant: 'Mohammed Rafiq, 60',
    summary: 'Looks eligible, but documents disagree.',
    request: 'Verify Old Age Pension application APL-2026-002210 against scheme OAP-2026 and recommend a decision.',
    plan: ['Fetch the applicant record and uploaded documents', 'Check each eligibility rule of scheme OAP-2026', 'Check the beneficiary registry for duplicates', 'Compute a confidence score and route for approval'],
    tools: [
      { tool: 'fetch_applicant_record', args: { application_id: 'APL-2026-002210' }, response: { name: 'Mohammed Rafiq', dob_form: '1966-01-02', dob_aadhaar: '1965-11-20', annual_income: 72000, income_cert_valid_till: '2026-09-30', residence_years: 31, address_form: '14 Rahmat Nagar', address_aadhaar: '41 Rahmat Nagar', ocr_confidence: 0.83 }, ms: 340, note: 'DOB and house number differ between form and Aadhaar.' },
      { tool: 'verify_policy_rules', args: { scheme: 'OAP-2026', record_ref: 'APL-2026-002210' }, response: { 'R1 age ≥ 60': 'PASS (60, using Aadhaar DOB)', 'R2 income < ₹1,00,000': 'PASS (₹72,000)', 'R3 resident ≥ 10 yrs': 'PASS (31)', 'R4 valid income certificate': 'FAIL (expired 30 Sep 2026)', 'R5 Aadhaar-seeded account': 'PASS' }, ms: 150, note: '4/5 rules pass — income certificate expired.' },
      { tool: 'check_duplicate_beneficiary', args: { aadhaar_hash: '3b70…', account_hash: 'f1d9…' }, response: { duplicates_found: 0 }, ms: 205, note: 'No duplicates.' },
    ],
    signals: [
      { name: 'Document consistency', weight: 0.3, value: 0.55, why: 'DOB & house number mismatch' },
      { name: 'Policy rules', weight: 0.4, value: 0.7, why: '4/5 pass; certificate expired' },
      { name: 'Duplicate check', weight: 0.2, value: 1, why: 'No duplicates' },
      { name: 'Data quality (OCR)', weight: 0.1, value: 0.83, why: 'OCR confidence 0.83 (smudged scan)' },
    ],
    recommendation: 'APPROVE',
    rationale: 'Applicant appears eligible on age, income and residence; the income certificate has lapsed and minor document mismatches exist.',
    flags: ['Income certificate expired on 30 Sep 2026', 'DOB on form (02 Jan 1966) ≠ Aadhaar (20 Nov 1965)', 'House number 14 vs 41 — likely OCR or typo'],
    correct: 'HOLD',
    lesson: 'The agent leaned “approve”, but a human spots that an expired certificate is a hard rule failure. The right move is to EDIT the decision: put it on hold and request an updated certificate — not approve, not reject.',
  },
  {
    id: 'APL-2026-003377',
    applicant: 'Suresh Kumar, claims 62',
    summary: 'Under-age per Aadhaar and a duplicate bank account.',
    request: 'Verify Old Age Pension application APL-2026-003377 against scheme OAP-2026 and recommend a decision.',
    plan: ['Fetch the applicant record and uploaded documents', 'Check each eligibility rule of scheme OAP-2026', 'Check the beneficiary registry for duplicates', 'Compute a confidence score and route for approval'],
    tools: [
      { tool: 'fetch_applicant_record', args: { application_id: 'APL-2026-003377' }, response: { name: 'Suresh Kumar', dob_form: '1964-06-15', dob_aadhaar: '1968-06-15', annual_income: 64000, income_cert_valid_till: '2027-01-31', residence_years: 22, bank_account: 'XXXX9032', ocr_confidence: 0.95 }, ms: 330, note: 'Form claims 1964; Aadhaar says 1968 (age 58).' },
      { tool: 'verify_policy_rules', args: { scheme: 'OAP-2026', record_ref: 'APL-2026-003377' }, response: { 'R1 age ≥ 60': 'FAIL (58 per Aadhaar)', 'R2 income < ₹1,00,000': 'PASS', 'R3 resident ≥ 10 yrs': 'PASS', 'R4 valid income certificate': 'PASS', 'R5 Aadhaar-seeded account': 'PASS' }, ms: 145, note: 'Age rule fails.' },
      { tool: 'check_duplicate_beneficiary', args: { aadhaar_hash: '9e14…', account_hash: '0a5b…' }, response: { duplicates_found: 1, match: 'Account XXXX9032 already receives OAP for beneficiary BEN-2024-118204 (Kamla Devi)' }, ms: 230, note: 'Bank account already linked to another active pensioner.' },
    ],
    signals: [
      { name: 'Document consistency', weight: 0.3, value: 0.9, why: 'Clear scans; DOB conflict is explicit' },
      { name: 'Policy rules', weight: 0.4, value: 0.95, why: 'Age rule clearly fails' },
      { name: 'Duplicate check', weight: 0.2, value: 0.7, why: 'Shared account — could be a family member' },
      { name: 'Data quality (OCR)', weight: 0.1, value: 0.95, why: 'OCR confidence 0.95' },
    ],
    recommendation: 'REJECT',
    rationale: 'Applicant is 58 per Aadhaar (below 60) and the bank account already receives a pension for another beneficiary.',
    flags: ['Age 58 per Aadhaar — form claims 62', 'Bank account shared with active beneficiary BEN-2024-118204'],
    correct: 'REJECT',
    lesson: 'An adverse decision affecting a citizen must be reviewed and owned by a human — even when the agent is confident. The human also adds a reason and a route to appeal.',
  },
];

const NODES = [
  { id: 'request', label: 'User request', icon: User },
  { id: 'plan', label: 'Agent plan', icon: Brain },
  { id: 'tool0', label: 'fetch_applicant_record', icon: Wrench },
  { id: 'tool1', label: 'verify_policy_rules', icon: Wrench },
  { id: 'tool2', label: 'check_duplicate', icon: Wrench },
  { id: 'conf', label: 'Confidence score', icon: Gauge },
  { id: 'gate', label: 'HITL approval gate', icon: UserCheck },
  { id: 'outcome', label: 'Outcome & audit', icon: ScrollText },
];

interface Verdict {
  final: Decision;
  by: 'human' | 'auto';
  action: 'approve' | 'edit' | 'reject' | 'auto';
  note: string;
  policyViolation: boolean;
}

const confidenceOf = (c: AgentCase) => c.signals.reduce((a, s) => a + s.weight * s.value, 0);

export default function Lab4Agent() {
  const [caseIdx, setCaseIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [threshold, setThreshold] = useState(0.9);
  const [humanForRejects, setHumanForRejects] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editDecision, setEditDecision] = useState<Decision>('HOLD');
  const [editNote, setEditNote] = useState('');
  const [verdicts, setVerdicts] = useLabData<Record<string, Verdict>>('lab-4:verdicts', {});
  const [usedEdit, setUsedEdit] = useState(false);
  const [sawRiskyAuto, setSawRiskyAuto] = useState(false);

  const c = CASES[caseIdx];
  const conf = confidenceOf(c);
  const autoEligible = c.recommendation === 'APPROVE' ? conf >= threshold : !humanForRejects && conf >= threshold;
  const verdict = verdicts[c.id];
  const last = NODES.length - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (step < 6) setStep(step + 1);
      else setPlaying(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [playing, step]);

  // Auto-actioned cases skip the gate.
  useEffect(() => {
    if (step === 6 && autoEligible && !verdict) {
      const v: Verdict = { final: c.recommendation, by: 'auto', action: 'auto', note: 'Auto-actioned above threshold', policyViolation: c.recommendation === 'REJECT' };
      setVerdicts({ ...verdicts, [c.id]: v });
      if (c.correct !== c.recommendation) setSawRiskyAuto(true);
      setStep(7);
    }
  }, [step, autoEligible, verdict, c, verdicts, setVerdicts]);

  const decide = (action: Verdict['action'], final: Decision, note: string) => {
    setVerdicts({ ...verdicts, [c.id]: { final, by: 'human', action, note, policyViolation: false } });
    if (action === 'edit') setUsedEdit(true);
    setEditing(false);
    setStep(7);
  };
  const resetCase = () => {
    const next = { ...verdicts };
    delete next[c.id];
    setVerdicts(next);
    setStep(0);
    setPlaying(false);
    setEditing(false);
  };
  const goCase = (i: number) => {
    setCaseIdx(i);
    setStep(verdicts[CASES[i].id] ? 7 : 0);
    setPlaying(false);
    setEditing(false);
  };

  const caseScore = (cs: AgentCase) => {
    const v = verdicts[cs.id];
    if (!v) return null;
    if (v.final !== cs.correct) return 0;
    return v.policyViolation ? 0.5 : 1;
  };
  const scored = CASES.map(caseScore);
  const completed = scored.filter((s) => s !== null).length;
  const labScore = completed ? (scored.reduce<number>((a, s) => a + (s ?? 0), 0) / CASES.length) * 100 : 0;

  const activeNode = NODES[step]?.id;
  const toolIdx = step >= 2 && step <= 4 ? step - 2 : null;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Application queue:</span>
          {CASES.map((cs, i) => {
            const s = caseScore(cs);
            return (
              <button type="button" key={cs.id} onClick={() => goCase(i)} className={cx('flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium', i === caseIdx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700')}>
                {s === null ? <span className="h-2 w-2 rounded-full bg-slate-300" /> : s === 1 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : s === 0.5 ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}
                {cs.id} · {cs.applicant}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Slider label="Auto-approve threshold" value={threshold} min={0.5} max={0.99} step={0.01} onChange={setThreshold} format={(v) => v.toFixed(2)} hint="APPROVE recommendations at or above this confidence skip the human gate" />
          <Toggle label="Policy: adverse decisions (rejections) always need a human" checked={humanForRejects} onChange={setHumanForRejects} hint="Recommended for citizen-facing decisions (and required for high-risk systems in many regimes)" />
        </div>
      </Card>

      {/* Flowchart */}
      <Card>
        <SectionLabel>Execution flow — {c.id}</SectionLabel>
        <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center">
          {NODES.map((n, i) => {
            const isActive = i === step;
            const isDone = i < step;
            const skipped = n.id === 'gate' && verdict?.by === 'auto';
            return (
              <Fragment key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setStep(i === 7 && !verdict ? Math.min(step, 6) : i);
                  }}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left text-[11px] font-semibold transition md:min-w-[110px]',
                    isActive ? 'border-indigo-500 bg-indigo-50 shadow dark:bg-indigo-950/40' : isDone ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-slate-200 opacity-60 dark:border-slate-800',
                    skipped && 'border-dashed border-amber-400 bg-amber-50 opacity-100 dark:bg-amber-950/20',
                  )}
                >
                  <n.icon className={cx('h-4 w-4 shrink-0', isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-slate-400')} />
                  <span className={cx(n.id.startsWith('tool') && 'font-mono')}>{skipped ? 'Gate skipped (auto)' : n.label}</span>
                </button>
                {i < NODES.length - 1 && (
                  <span className="flex justify-center text-slate-300 dark:text-slate-700">
                    <ArrowRight className="hidden h-4 w-4 md:block" />
                    <ArrowDown className="h-3.5 w-3.5 md:hidden" />
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" disabled={step === 0} onClick={() => { setPlaying(false); setStep(step - 1); }}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Button size="sm" disabled={step >= 6} onClick={() => { setPlaying(false); setStep(step + 1); }}>
            Next step <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="secondary" disabled={step >= 6} onClick={() => setPlaying(!playing)}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? 'Pause' : 'Auto-play to the gate'}
          </Button>
          <Button size="sm" variant="ghost" onClick={resetCase}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset case
          </Button>
          <span className="ml-auto text-xs text-slate-500">
            Step {Math.min(step, last) + 1} of {NODES.length}
          </span>
        </div>
      </Card>

      {/* Step detail */}
      <div key={`${c.id}-${step}`} className="animate-fade-in">
        {activeNode === 'request' && (
          <Card>
            <SectionLabel>1 · User request</SectionLabel>
            <div className="flex gap-3">
              <User className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-medium">“{c.request}”</p>
                <p className="mt-1 text-xs text-slate-500">Submitted by the district welfare office queue · applicant: {c.applicant} · {c.summary}</p>
              </div>
            </div>
          </Card>
        )}
        {activeNode === 'plan' && (
          <Card>
            <SectionLabel>2 · Agent thought / plan</SectionLabel>
            <div className="flex gap-3">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-violet-500" />
              <div className="flex-1">
                <p className="text-sm italic text-slate-600 dark:text-slate-300">“To recommend a decision I need verified facts, not the form’s claims. I’ll gather evidence with tools, apply the scheme rules, then score my confidence.”</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {c.plan.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
                <div className="mt-2 text-[11px] text-slate-500">Tools available: fetch_applicant_record (read-only), verify_policy_rules (read-only), check_duplicate_beneficiary (read-only). The agent cannot approve or pay — only recommend.</div>
              </div>
            </div>
          </Card>
        )}
        {toolIdx !== null && (
          <Card>
            <SectionLabel>{3 + toolIdx} · Tool call: <span className="font-mono normal-case">{c.tools[toolIdx].tool}</span></SectionLabel>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">Request (emitted by the model)</div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-sky-300">{JSON.stringify({ type: 'tool_use', name: c.tools[toolIdx].tool, input: c.tools[toolIdx].args }, null, 2)}</pre>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Response (from the real system)</span>
                  <span className="font-mono">{c.tools[toolIdx].ms} ms</span>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">{JSON.stringify(c.tools[toolIdx].response, null, 2)}</pre>
              </div>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-violet-600">Observation:</span> {c.tools[toolIdx].note}
            </p>
          </Card>
        )}
        {activeNode === 'conf' && (
          <Card>
            <SectionLabel>6 · Confidence score calculation</SectionLabel>
            <div className="space-y-2">
              {c.signals.map((s) => (
                <div key={s.name} className="grid items-center gap-2 text-xs sm:grid-cols-[170px_1fr_120px]">
                  <span className="font-semibold">
                    {s.name} <span className="font-normal text-slate-400">× {s.weight}</span>
                  </span>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={cx('h-full rounded-full', s.value >= 0.9 ? 'bg-emerald-500' : s.value >= 0.7 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${s.value * 100}%` }} />
                  </div>
                  <span className="text-slate-500">
                    {s.value.toFixed(2)} · {s.why}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="font-mono text-xs">Σ weight × value =</span>
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{conf.toFixed(2)}</span>
              <Badge tone={c.recommendation === 'APPROVE' ? 'green' : 'red'}>Recommends {c.recommendation}</Badge>
              <span className="text-xs text-slate-500">
                Threshold {threshold.toFixed(2)} → {autoEligible ? <strong className="text-amber-600">will auto-action (skips human)</strong> : <strong className="text-indigo-600">routes to a human reviewer</strong>}
              </span>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Agent rationale:</span> {c.rationale}
            </p>
          </Card>
        )}
        {activeNode === 'gate' && !verdict && (
          <Card className="border-2 border-indigo-400">
            <SectionLabel>7 · Human-in-the-loop approval gate</SectionLabel>
            <div className="grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.id}</span> · {c.applicant}
                  <Badge tone={c.recommendation === 'APPROVE' ? 'green' : 'red'}>
                    AI recommends {c.recommendation} ({conf.toFixed(2)})
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{c.rationale}</p>
                {c.flags.length > 0 ? (
                  <ul className="space-y-1">
                    {c.flags.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">No discrepancies flagged.</p>
                )}
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold text-slate-500">Evidence: tool responses</summary>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-100 p-2 font-mono text-[11px] dark:bg-slate-800">{JSON.stringify(c.tools.map((t) => ({ [t.tool]: t.response })), null, 2)}</pre>
                </details>
              </div>
              <div className="space-y-2">
                {!editing ? (
                  <>
                    <Button variant="success" className="w-full" onClick={() => decide('approve', 'APPROVE', 'Approved as recommended')}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
                      <PencilLine className="h-4 w-4" /> Edit decision
                    </Button>
                    <Button variant="danger" className="w-full" onClick={() => decide('reject', 'REJECT', 'Rejected by reviewer')}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    <p className="text-[11px] text-slate-500">Reviewers see the AI’s reasons and evidence — but the decision and accountability are theirs.</p>
                  </>
                ) : (
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="text-xs font-semibold">Edit the decision</div>
                    <select value={editDecision} onChange={(e) => setEditDecision(e.target.value as Decision)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <option value="APPROVE">Approve</option>
                      <option value="HOLD">Hold — request documents from citizen</option>
                      <option value="REJECT">Reject</option>
                    </select>
                    <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={3} placeholder="Reason / message to citizen (required for audit)" className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900" />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={!editNote.trim()} onClick={() => decide('edit', editDecision, editNote.trim())}>
                        Submit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
        {(activeNode === 'outcome' || (activeNode === 'gate' && verdict)) && verdict && (
          <Card className={cx('border-2', caseScore(c) === 1 ? 'border-emerald-400' : caseScore(c) === 0.5 ? 'border-amber-400' : 'border-rose-400')}>
            <SectionLabel>8 · Outcome & audit log</SectionLabel>
            <div className="flex flex-wrap items-center gap-2 text-lg font-bold">
              Final decision: {verdict.final}
              <Badge tone={verdict.by === 'auto' ? 'amber' : 'indigo'}>{verdict.by === 'auto' ? 'auto-actioned by the system' : `decided by human (${verdict.action})`}</Badge>
              {caseScore(c) === 1 && <Badge tone="green">correct</Badge>}
              {caseScore(c) === 0.5 && <Badge tone="amber">right answer, wrong process</Badge>}
              {caseScore(c) === 0 && <Badge tone="red">incorrect — expected {c.correct}</Badge>}
            </div>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-100 p-3 font-mono text-[11px] dark:bg-slate-800">
              {JSON.stringify(
                {
                  application_id: c.id,
                  agent_version: 'verifier-agent v2.3',
                  model: 'frontier-2026-09',
                  tools_called: c.tools.map((t) => t.tool),
                  confidence: Number(conf.toFixed(2)),
                  ai_recommendation: c.recommendation,
                  threshold,
                  decided_by: verdict.by === 'auto' ? 'SYSTEM (auto)' : 'officer_112',
                  final_decision: verdict.final,
                  reason: verdict.note,
                  timestamp: '2026-11-13T11:05:22+05:30',
                },
                null,
                2,
              )}
            </pre>
            <div className="mt-3">
              <Callout tone={caseScore(c) === 1 ? 'success' : 'warn'} title="Debrief">
                {verdict.by === 'auto' && c.correct !== c.recommendation && 'The threshold was low enough that a flawed case was auto-approved without anyone noticing the expired certificate. Raise the threshold or add hard-rule checks that force review. '}
                {verdict.policyViolation && 'An adverse decision was auto-actioned with no human accountable — a governance failure even though the outcome was right. '}
                {c.lesson}
              </Callout>
            </div>
          </Card>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">Queue progress: {completed}/{CASES.length} decided</span>
          <span className="text-sm text-slate-500">Decision quality: {Math.round(labScore)}%</span>
          {caseIdx < CASES.length - 1 && verdict && (
            <Button size="sm" className="ml-auto" onClick={() => goCase(caseIdx + 1)}>
              Next application <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </Card>

      <Missions
        labId="lab-4"
        score={labScore}
        missions={[
          { id: 'all', label: 'Step through and decide all 3 applications', done: completed === CASES.length },
          { id: 'correct', label: 'Reach the correct outcome on every case with a human accountable', done: scored.every((s) => s === 1) },
          { id: 'edit', label: 'Use “Edit decision” to override the agent with a reasoned hold', done: usedEdit },
          { id: 'risky', label: 'Lower the threshold until a flawed case gets auto-approved (then learn why)', done: sawRiskyAuto },
        ]}
      />
    </div>
  );
}
