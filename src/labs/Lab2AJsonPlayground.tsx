import { useState } from 'react';
import { Play, Repeat, CheckCircle2, XCircle, AlertTriangle, FileJson, Trash2 } from 'lucide-react';
import { Badge, Button, Callout, Card, Meter, Missions, SectionLabel, Slider, Stat, Toggle, cx } from '../components/ui';
import { GRIEVANCE_SCHEMA, validateJsonText } from '../lib/jsonSchema';
import { hashString, rng } from '../lib/math';
import { useLabData } from '../store/progress';

interface Extraction {
  applicant_name: string;
  application_id: string | null;
  department: string;
  issue_category: string;
  urgency: string;
  requested_action: string;
  contact_phone: string | null;
}
interface Note {
  id: string;
  title: string;
  text: string;
  truth: Extraction;
  fakeId: string;
  fakePhone: string;
}

const NOTES: Note[] = [
  {
    id: 'passport',
    title: 'Passport renewal delay',
    text: 'Hello sir, I am Ramesh Kumar. I applied for passport renewal on 3 Sept, application PSK-2026-004512, still no update after 2 months!! Police verification already done. Pls expedite, I have to travel for my daughter’s wedding in December. My no. is 98450 12345.',
    truth: { applicant_name: 'Ramesh Kumar', application_id: 'PSK-2026-004512', department: 'Passport Seva', issue_category: 'delay', urgency: 'high', requested_action: 'Expedite passport renewal before December travel', contact_phone: '+919845012345' },
    fakeId: 'PSK-2026-009871',
    fakePhone: '+919845012354',
  },
  {
    id: 'pension',
    title: 'Pension not credited (no application ID)',
    text: 'Writing for my mother Kamala Devi (81 yrs). Her pension has not come since July, bank says nothing received from treasury. She has no other income. We don’t have any application number, PPO is with the bank. Call me on 7012345678. Please help urgently.',
    truth: { applicant_name: 'Kamala Devi', application_id: null, department: 'Pensions', issue_category: 'payment', urgency: 'high', requested_action: 'Release pending pension payments since July', contact_phone: '+917012345678' },
    fakeId: 'PEN-2026-118832',
    fakePhone: '+917012345687',
  },
  {
    id: 'water',
    title: 'Water outage (no phone number)',
    text: 'WARD 12 NO WATER FOR 4 DAYS!!! tanker promised on monday never came. complaint WTR-2026-000917 already raised, nobody picks up helpline. old people and kids suffering. — Sunil Patil, Ganesh Nagar',
    truth: { applicant_name: 'Sunil Patil', application_id: 'WTR-2026-000917', department: 'Water Supply', issue_category: 'service_outage', urgency: 'high', requested_action: 'Restore water supply to Ward 12 and send a tanker', contact_phone: null },
    fakeId: 'WTR-2026-000971',
    fakePhone: '+919822012345',
  },
  {
    id: 'bribe',
    title: 'Staff conduct complaint',
    text: 'The lineman who came to fix my meter asked for ₹2000 “speed money” before he would do the work. Ref no ELC-2026-450021. Name: Fatima Shaikh, ph 9988776655. Power is back now so not urgent, but please take action against him.',
    truth: { applicant_name: 'Fatima Shaikh', application_id: 'ELC-2026-450021', department: 'Electricity', issue_category: 'staff_conduct', urgency: 'medium', requested_action: 'Investigate the lineman’s bribe demand', contact_phone: '+919988776655' },
    fakeId: 'ELC-2026-450012',
    fakePhone: '+919988776656',
  },
];

interface RunRecord {
  n: number;
  note: string;
  temp: number;
  strict: boolean;
  nullPolicy: boolean;
  valid: boolean;
  correctFields: number;
  hallucinated: string[];
}

function simulate(note: Note, temp: number, strict: boolean, nullPolicy: boolean, seed: number) {
  const r = rng(hashString(note.id) + seed * 7919 + Math.round(temp * 100));
  const out: Record<string, unknown> = { ...note.truth };
  const hallucinated: string[] = [];
  const events: string[] = [];

  // Value-level hallucinations: schema can't prevent these.
  const missingFields = (['application_id', 'contact_phone'] as const).filter((f) => note.truth[f] === null);
  for (const f of missingFields) {
    const p = (nullPolicy ? 0.04 : 0.45) + temp * 0.3;
    if (r() < p) {
      out[f] = f === 'application_id' ? note.fakeId : note.fakePhone;
      hallucinated.push(f);
      events.push(`invented a value for ${f} (not in the text)`);
    }
  }
  if (r() < temp * temp * 0.55) {
    const f = r() < 0.5 ? 'contact_phone' : 'application_id';
    if (out[f] !== null) {
      out[f] = f === 'application_id' ? note.fakeId : note.fakePhone;
      if (!hallucinated.includes(f)) hallucinated.push(f);
      events.push(`garbled digits in ${f}`);
    }
  }
  if (r() < temp * 0.45) {
    const opts = ['low', 'medium', 'high'].filter((u) => u !== note.truth.urgency);
    out.urgency = opts[Math.floor(r() * opts.length)];
    hallucinated.push('urgency');
    events.push('mis-judged urgency');
  }
  if (r() < temp * 0.3) {
    out.requested_action = `${note.truth.requested_action} and pay compensation`;
    hallucinated.push('requested_action');
    events.push('added a request the citizen never made');
  }

  // Structural defects: prevented entirely by strict schema mode.
  let text: string;
  if (!strict) {
    if (r() < temp * 0.5) {
      out.urgency = r() < 0.5 ? 'very high' : 'URGENT';
      events.push('invented an enum value for urgency');
    }
    if (r() < temp * 0.35 && typeof out.contact_phone === 'string') {
      out.contact_phone = Number(String(out.contact_phone).replace(/\D/g, '').slice(-10));
      events.push('returned phone as a number');
    }
    if (r() < temp * 0.3) {
      out.applicantName = out.applicant_name;
      delete out.applicant_name;
      events.push('renamed applicant_name → applicantName');
    }
    if (r() < temp * 0.25) {
      out.department = note.truth.department === 'Passport Seva' ? 'Passport Office' : `${note.truth.department} Dept`;
      events.push('department not in the allowed list');
    }
    text = JSON.stringify(out, null, 2);
    const fmt = r();
    if (fmt < 0.12 + temp * 0.45) {
      const kind = Math.floor(r() * 4);
      if (kind === 0) {
        text = `Sure! Here is the extracted grievance data:\n\n${text}\n\nLet me know if you need anything else.`;
        events.push('wrapped JSON in chatty prose');
      } else if (kind === 1) {
        text = '```json\n' + text + '\n```';
        events.push('wrapped JSON in a markdown code fence');
      } else if (kind === 2) {
        text = text.replace(/\n}$/, ',\n}');
        events.push('left a trailing comma');
      } else {
        text = text.slice(0, Math.floor(text.length * 0.8));
        events.push('output cut off mid-JSON');
      }
    }
  } else {
    text = JSON.stringify(out, null, 2);
  }
  return { text, hallucinated: [...new Set(hallucinated)], events };
}

function fieldAccuracy(value: unknown, truth: Extraction) {
  if (!value || typeof value !== 'object') return { correct: 0, wrong: Object.keys(truth) };
  const v = value as Record<string, unknown>;
  const wrong: string[] = [];
  let correct = 0;
  (Object.keys(truth) as (keyof Extraction)[]).forEach((k) => {
    const tv = truth[k];
    const ov = v[k];
    const ok = k === 'requested_action' ? typeof ov === 'string' && ov === tv : ov === tv;
    if (ok) correct++;
    else wrong.push(k);
  });
  return { correct, wrong };
}

export default function Lab2AJsonPlayground() {
  const [noteId, setNoteId] = useState('pension');
  const [temp, setTemp] = useState(0.7);
  const [strict, setStrict] = useState(false);
  const [nullPolicy, setNullPolicy] = useState(false);
  const [seed, setSeed] = useState(1);
  const [last, setLast] = useState<ReturnType<typeof simulate> | null>(null);
  const [runs, setRuns] = useLabData<RunRecord[]>('lab-2a:runs', []);
  const note = NOTES.find((n) => n.id === noteId)!;

  const res = last ? validateJsonText(last.text, GRIEVANCE_SCHEMA) : null;
  const acc = res?.parsed ? fieldAccuracy(res.value, note.truth) : null;

  const record = (sim: ReturnType<typeof simulate>, n: number, list: RunRecord[]): RunRecord[] => {
    const v = validateJsonText(sim.text, GRIEVANCE_SCHEMA);
    const a = v.parsed ? fieldAccuracy(v.value, note.truth) : { correct: 0 };
    return [{ n, note: noteId, temp, strict, nullPolicy, valid: v.valid, correctFields: a.correct, hallucinated: sim.hallucinated }, ...list].slice(0, 40);
  };
  const runOnce = () => {
    const sim = simulate(note, temp, strict, nullPolicy, seed);
    setLast(sim);
    setRuns(record(sim, (runs[0]?.n ?? 0) + 1, runs));
    setSeed(seed + 1);
  };
  const runFive = () => {
    let list = runs;
    let sim = simulate(note, temp, strict, nullPolicy, seed);
    for (let i = 0; i < 5; i++) {
      sim = simulate(note, temp, strict, nullPolicy, seed + i);
      list = record(sim, (list[0]?.n ?? 0) + 1, list);
    }
    setLast(sim);
    setRuns(list);
    setSeed(seed + 5);
  };

  // Expected (analytical) risk for the current settings
  const missingCount = (['application_id', 'contact_phone'] as const).filter((f) => note.truth[f] === null).length;
  const pStructural = strict ? 0 : Math.min(0.97, 1 - (1 - (0.12 + temp * 0.45)) * (1 - temp * 0.5) * (1 - temp * 0.3) * (1 - temp * 0.25));
  const pHalluc = Math.min(0.97, 1 - (1 - ((nullPolicy ? 0.04 : 0.45) + temp * 0.3)) ** missingCount * (1 - temp * 0.45) * (1 - temp * 0.3) * (1 - temp * temp * 0.55));

  const sawValidCorrectLowT = runs.some((r) => r.temp <= 0.2 && r.strict && r.valid && r.correctFields === 7);
  const sawBroken = runs.some((r) => r.temp >= 0.7 && !r.strict && !r.valid);
  const sawSchemaValidHalluc = runs.some((r) => r.strict && r.valid && r.hallucinated.length > 0);
  const notesTried = new Set(runs.map((r) => r.note)).size;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <SectionLabel>1 · Pick a messy citizen note</SectionLabel>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {NOTES.map((n) => (
              <button
                type="button"
                key={n.id}
                onClick={() => {
                  setNoteId(n.id);
                  setLast(null);
                }}
                className={cx('rounded-full border px-3 py-1 text-xs font-medium', noteId === n.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}
              >
                {n.title}
              </button>
            ))}
          </div>
          <p className="rounded-xl bg-amber-50 p-3 text-sm leading-relaxed dark:bg-amber-950/30">“{note.text}”</p>
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer font-semibold text-slate-500">View the target JSON Schema (portal contract)</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-sky-200">{JSON.stringify(GRIEVANCE_SCHEMA, null, 2)}</pre>
          </details>
        </Card>
        <Card className="space-y-4">
          <SectionLabel className="mb-0">2 · Configure the model call</SectionLabel>
          <Slider label="Temperature" value={temp} min={0} max={1} step={0.05} onChange={setTemp} format={(v) => v.toFixed(2)} hint="0 = most likely token every time" />
          <Toggle label="Enforce strict JSON Schema" checked={strict} onChange={setStrict} hint="Structured-output / constrained decoding" />
          <Toggle label="Instruct: use null when a value isn’t stated" checked={nullPolicy} onChange={setNullPolicy} hint="Explicit null policy in the system prompt" />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={runOnce}>
              <Play className="h-4 w-4" /> Run extraction
            </Button>
            <Button variant="secondary" onClick={runFive}>
              <Repeat className="h-4 w-4" /> Run 5×
            </Button>
          </div>
          <Meter label="Chance of broken / invalid JSON" value={pStructural * 100} invert suffix="%" />
          <Meter label="Hallucination risk (wrong or invented values)" value={pHalluc * 100} invert suffix="%" detail={strict ? 'Strict schema can’t prevent this — it only fixes the shape.' : undefined} />
        </Card>
      </div>

      {last && res && (
        <div className="grid animate-fade-in gap-5 lg:grid-cols-2">
          <Card>
            <SectionLabel className="flex items-center gap-1.5">
              <FileJson className="h-3.5 w-3.5" /> 3 · Raw model output
            </SectionLabel>
            <pre className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">{last.text}</pre>
            {last.events.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {last.events.map((e) => (
                  <Badge key={e} tone="amber">
                    {e}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
          <Card className="space-y-3">
            <SectionLabel className="mb-0">4 · Validation & truth check</SectionLabel>
            <div className={cx('flex items-center gap-2 rounded-xl p-3 text-sm font-semibold', res.valid ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200')}>
              {res.valid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {res.valid ? 'Schema validation PASSED — the portal will accept this' : `Schema validation FAILED (${res.issues.length} issue${res.issues.length > 1 ? 's' : ''}) — the portal rejects it`}
            </div>
            {res.issues.length > 0 && (
              <ul className="max-h-36 space-y-1 overflow-auto">
                {res.issues.map((i, k) => (
                  <li key={k} className="rounded bg-rose-50 px-2 py-1 font-mono text-[11px] text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                    <strong>{i.path}</strong>: {i.message}
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Fields correct vs. truth" value={acc ? `${acc.correct}/7` : '0/7'} tone={acc?.correct === 7 ? 'text-emerald-600' : 'text-rose-600'} />
              <Stat label="Hallucinated values" value={last.hallucinated.length} tone={last.hallucinated.length ? 'text-rose-600' : 'text-emerald-600'} sub={last.hallucinated.join(', ') || 'none'} />
            </div>
            {res.valid && last.hallucinated.length > 0 && (
              <Callout tone="danger" title="Schema-valid hallucination">
                Perfectly shaped JSON, accepted by the portal — but {last.hallucinated.join(' and ')} {last.hallucinated.length > 1 ? 'are' : 'is'} wrong. This is why you need business-rule checks, a null policy and low temperature, not just a schema.
              </Callout>
            )}
            {res.valid && last.hallucinated.length === 0 && <Callout tone="success">Valid and faithful to the source note. This is what production should look like on every run.</Callout>}
            {!res.valid && <Callout tone="warn">Unparseable or invalid output. Fixes: strict schema mode, lower temperature, then one retry with the validation error and a human-review fallback.</Callout>}
          </Card>
        </div>
      )}

      {runs.length > 0 && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel className="mb-0">Run history (saved)</SectionLabel>
            <Button size="sm" variant="ghost" onClick={() => setRuns([])}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white text-left text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="py-1.5">#</th>
                  <th>Note</th>
                  <th>Temp</th>
                  <th>Strict</th>
                  <th>Null policy</th>
                  <th>Valid JSON</th>
                  <th>Fields correct</th>
                  <th>Hallucinated</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.n} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 font-mono text-slate-400">{r.n}</td>
                    <td>{NOTES.find((n) => n.id === r.note)?.title.split(' (')[0]}</td>
                    <td className="font-mono">{r.temp.toFixed(2)}</td>
                    <td>{r.strict ? 'on' : 'off'}</td>
                    <td>{r.nullPolicy ? 'on' : 'off'}</td>
                    <td>{r.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}</td>
                    <td className={cx('font-semibold', r.correctFields === 7 ? 'text-emerald-600' : 'text-rose-600')}>{r.correctFields}/7</td>
                    <td>{r.hallucinated.length ? <span className="flex items-center gap-1 text-rose-600"><AlertTriangle className="h-3 w-3" /> {r.hallucinated.join(', ')}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Callout tone="tip" title="The PM recipe for reliable extraction">
        Temperature ≤ 0.2 · strict schema / structured-output mode · explicit “null if not stated” rule · code validation of patterns and enums · one retry with the error message · human queue for anything still failing · log raw + parsed outputs.
      </Callout>

      <Missions
        labId="lab-2a"
        missions={[
          { id: 'clean', label: 'Get valid, 7/7-correct JSON at temperature ≤ 0.2 with strict schema on', done: sawValidCorrectLowT },
          { id: 'break', label: 'Break the JSON at temperature ≥ 0.7 without strict schema', done: sawBroken },
          { id: 'halluc', label: 'Catch a schema-valid hallucination (strict on, but a value is invented)', done: sawSchemaValidHalluc },
          { id: 'all', label: 'Run extractions on all 4 citizen notes', done: notesTried >= 4 },
        ]}
      />
    </div>
  );
}
