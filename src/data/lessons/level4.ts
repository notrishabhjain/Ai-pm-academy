import { Target, Brain, Wrench, Eye, CircleStop, User, Bot, Braces, Server, MessageCircle, Plug, Split, ListOrdered, Network, Users, ClipboardCheck, Gauge, SplitSquareHorizontal, UserCheck, Inbox, ScrollText } from 'lucide-react';
import type { Lesson } from '../types';

export const level4Lessons: Lesson[] = [
  {
    id: 'chatbot-vs-agent',
    levelId: 4,
    title: 'Passive Chatbots vs. Autonomous Agents',
    summary: 'A chatbot tells you how; an agent goes and does it — planning, calling tools, checking results and looping until the goal is met.',
    minutes: 12,
    analogy: {
      title: 'The receptionist vs. the personal assistant',
      story: [
        'Ask a receptionist, “How do I reschedule my passport appointment?” and they explain the steps: log in, choose “reschedule”, pick a slot. Helpful — but you still do the work. That is a chatbot.',
        'Give the same request to a capable personal assistant and they open the portal, check your calendar, find a free morning slot next week, try to book it, notice it was just taken, pick the next one, confirm and email you the receipt. They think, act, look at what happened and adjust. That is an agent.',
        'Now imagine giving that assistant your company credit card with no spending limit and no instruction to stop. They might keep “improving” your booking all day. Agents need clear goals, a limited set of tools, budgets, stop conditions, and approval points for anything risky.',
      ],
      mapping: [
        { everyday: 'Receptionist explaining steps', ai: 'Chatbot — generates text only' },
        { everyday: 'Assistant who actually books it', ai: 'Agent — LLM + tools in a loop' },
        { everyday: 'Think → try → check → adjust', ai: 'ReAct loop: Thought → Action → Observation' },
        { everyday: 'Credit card limits and “ask me before paying”', ai: 'Budgets, max iterations, human approval gates' },
      ],
      oneLiner: 'An agent is an LLM in a loop with tools and a goal — more powerful than a chatbot, and in need of more guardrails.',
    },
    diagram: {
      caption: 'The ReAct agent loop. Click through one full iteration.',
      loop: true,
      nodes: [
        { id: 'goal', label: 'Goal', sub: 'user request', icon: Target },
        { id: 'think', label: 'Thought', sub: 'plan next step', icon: Brain },
        { id: 'act', label: 'Action', sub: 'call a tool', icon: Wrench },
        { id: 'observe', label: 'Observation', sub: 'tool result', icon: Eye },
        { id: 'stop', label: 'Done?', sub: 'stop condition', icon: CircleStop },
      ],
      steps: [
        { title: 'Receive a goal, not a question', body: '“Move my passport appointment to next week, morning slot.” The agent must achieve an outcome in the real world, not just reply.', active: ['goal'] },
        { title: 'Thought: decide the next step', body: 'The LLM reasons about what it knows and what it needs. It writes a short plan and picks the next action.', active: ['goal', 'think'], peek: 'Thought: I need the current booking ID and available slots next week.\nNext: call get_appointment(applicant_id)' },
        { title: 'Action: call a tool', body: 'The model emits a structured tool call. Your code (not the model) executes it against real systems — with the user’s permissions.', active: ['think', 'act'], peek: '{"tool": "list_slots", "args": {"centre": "PSK-Pune", "week": "2026-11-16", "period": "morning"}}' },
        { title: 'Observation: read the result', body: 'The tool’s response is fed back to the model. Things go wrong in the real world — slots get taken, APIs time out — so the agent must adapt.', active: ['act', 'observe'], peek: '{"slots": ["Tue 09:30", "Thu 10:15"]}\n→ book_slot("Tue 09:30") → {"error": "SLOT_TAKEN"}' },
        { title: 'Check: done, retry, or escalate?', body: 'The agent checks whether the goal is met. If not, it loops back to Thought. Production agents also stop on max iterations, budget, low confidence — or pause for human approval.', active: ['observe', 'stop'], peek: 'Thought: Tue taken, booking Thu 10:15 instead.\n→ book_slot("Thu 10:15") → {"status": "CONFIRMED"}\nStop: goal met ✅ (3 iterations, 4 tool calls)' },
      ],
    },
    sandboxTitle: 'Chatbot vs. agent — and the runaway loop',
    sandboxIntro: 'Send the same request to a chatbot and an agent. Then make the world messy (a slot gets taken) and remove the stop condition to see why iteration limits and budgets matter.',
    pmLens: {
      whenToUse: [
        'Multi-step tasks across systems with a clear, checkable goal (bookings, verifications, report compilation).',
        'Workflows where the path varies case by case and can’t be hard-coded easily.',
        'Start with “assistive” agents that propose actions for approval before fully autonomous ones.',
      ],
      costLatency: [
        'Each loop iteration is a full LLM call: cost and latency multiply with steps (often 3–20× a single chat turn).',
        'Tool calls add their own latency (APIs, databases) — agents can take seconds to minutes.',
        'Set hard caps: max iterations, max tokens, max spend per task.',
      ],
      failureModes: [
        'Infinite or long loops with no progress (“let me check again…”).',
        'Wrong tool or wrong arguments with real side effects (cancelling the wrong appointment).',
        'Goal drift — solving a different problem than the user asked.',
        'Over-broad permissions: the agent can do far more than the task needs.',
      ],
      questions: [
        'What is the maximum number of steps and spend per task, and what happens when we hit it?',
        'Which tool actions have irreversible side effects, and do they require human approval?',
        'How do we trace and replay an agent run when something goes wrong?',
      ],
    },
    quiz: [
      { q: 'What fundamentally distinguishes an agent from a chatbot?', options: ['A nicer UI', 'It runs in a loop, calls tools and acts toward a goal', 'It uses a bigger model', 'It never makes mistakes'], answer: 1, why: 'Agents plan, act through tools, observe results and iterate until a goal or stop condition.' },
      { q: 'Why do agents typically cost more per task than a chatbot reply?', options: ['They use more colours', 'Every reasoning step and tool result is another LLM call', 'Agents are always on frontier models', 'They don’t'], answer: 1, why: 'Iterations multiply LLM calls and tokens.' },
      { q: 'Which control most directly prevents runaway agent loops?', options: ['Higher temperature', 'Max iterations / budget limits and clear stop conditions', 'A longer system prompt', 'Bigger context window'], answer: 1, why: 'Hard caps and explicit success checks bound the loop.' },
    ],
    keyTerms: ['AI agent', 'ReAct', 'Tool / function calling', 'Human-in-the-loop (HITL)', 'Guardrails'],
  },
  {
    id: 'tool-calling-mcp',
    levelId: 4,
    title: 'Function / Tool Calling & the Model Context Protocol (MCP)',
    summary: 'How a model safely asks your software to do things — and how MCP standardises those connections so every tool doesn’t need custom wiring.',
    minutes: 12,
    analogy: {
      title: 'A chef who sends order slips',
      story: [
        'Picture a chef who never leaves the kitchen. They can’t open the pantry, use the till or call a delivery rider themselves. Instead, they write slips in a fixed format — “PANTRY: 2 kg basmati” — and hand them to staff, who do the job and send back a note: “Done, 1.4 kg left.” That is tool calling: the model writes a structured request, your code performs it, and the result goes back to the model.',
        'Now imagine every appliance in every kitchen needed its own custom wiring — a different plug for the oven in each restaurant. Chaos. MCP is like a standard plug socket: any appliance that follows the standard works in any kitchen that supports it.',
        'With MCP, a tool provider writes one “MCP server” (say, for your case-management system), and any MCP-compatible AI app can use it. You still decide which kitchens get which appliances — permissions don’t disappear just because the plug is standard.',
      ],
      mapping: [
        { everyday: 'Order slip in a fixed format', ai: 'Tool call: name + JSON arguments' },
        { everyday: 'Staff doing the actual work', ai: 'Your code executing the API / DB call' },
        { everyday: 'Note sent back to the chef', ai: 'Tool result returned to the model' },
        { everyday: 'Standard plug socket', ai: 'MCP — a common protocol for tools & data' },
        { everyday: 'Appliance with a standard plug', ai: 'MCP server (e.g. for your CRM or file store)' },
      ],
      oneLiner: 'The model only ever proposes structured requests; your software executes them — and MCP makes those connections reusable.',
    },
    diagram: {
      caption: 'One tool call, end to end — including where MCP fits.',
      nodes: [
        { id: 'user', label: 'User', sub: '“status of APL-…?”', icon: User },
        { id: 'llm', label: 'LLM', sub: 'chooses tool', icon: Bot },
        { id: 'call', label: 'Tool call', sub: 'JSON', icon: Braces },
        { id: 'mcp', label: 'MCP server', sub: 'standard interface', icon: Plug },
        { id: 'sys', label: 'Real system', sub: 'API · DB', icon: Server },
        { id: 'answer', label: 'Answer', sub: 'uses result', icon: MessageCircle },
      ],
      steps: [
        { title: 'The app tells the model which tools exist', body: 'Each tool is described with a name, a plain-English description and a JSON schema for its arguments. Good descriptions are product work — they decide when the model picks the tool.', active: ['llm'], peek: '{ "name": "get_application_status",\n  "description": "Look up the current status of a citizen application by ID",\n  "input_schema": { "application_id": "string, e.g. APL-2026-004512" } }' },
        { title: 'The user asks something that needs live data', body: '“What’s the status of APL-2026-004512?” The model can’t know this from training — it needs the system of record.', active: ['user', 'llm'] },
        { title: 'The model emits a tool call', body: 'Instead of answering, the model outputs a structured request. It has not touched any system yet — it has only asked.', active: ['llm', 'call'], peek: '{"type": "tool_use", "name": "get_application_status", "input": {"application_id": "APL-2026-004512"}}' },
        { title: 'Your code executes it — often via MCP', body: 'The host app validates the request, checks the user’s permissions, and calls the tool. With MCP, the tool lives behind a standard MCP server that any compliant AI app can connect to.', active: ['call', 'mcp', 'sys'], peek: 'MCP server "case-management" → GET /applications/APL-2026-004512\n← {"status": "POLICE_VERIFICATION_PENDING", "since": "2026-10-28"}' },
        { title: 'The model writes the final answer', body: 'The result is passed back and the model turns it into a helpful reply — grounded in live data rather than guesses.', active: ['answer'], peek: '"Your application APL-2026-004512 is awaiting police verification (since 28 Oct)."' },
      ],
    },
    sandboxTitle: 'Which tool would the model call?',
    sandboxIntro: 'Pick a user request and switch tools on or off. See the exact tool call the model would emit — or what it does when the right tool is missing. Then see why MCP turns N×M integrations into N+M.',
    pmLens: {
      whenToUse: [
        'Whenever answers depend on live data (status, balances, availability) or the user wants an action taken.',
        'Calculations and lookups that must be exact — let deterministic tools do them.',
        'MCP: when several AI apps need the same tools, or you want to plug in vendor-provided connectors.',
      ],
      costLatency: [
        'Every tool definition consumes prompt tokens on every call — 20 tools can mean thousands of tokens.',
        'Each tool round-trip adds an LLM call plus the API latency.',
        'MCP reduces integration build/maintenance cost; it does not reduce token cost.',
      ],
      failureModes: [
        'Vague tool descriptions → wrong tool chosen or required arguments invented.',
        'Tools with more power than needed (write access when read is enough).',
        'Untrusted tool output containing instructions (indirect prompt injection).',
        'Unvetted third-party MCP servers with broad data access.',
      ],
      questions: [
        'For each tool, what is the least privilege it needs, and is any action irreversible?',
        'How do we validate tool arguments before execution?',
        'Which MCP servers are approved, who maintains them, and what data can they reach?',
      ],
    },
    quiz: [
      { q: 'In tool calling, who actually executes the API call?', options: ['The LLM directly', 'Your application code, after the model requests it', 'The user', 'The vendor’s servers always'], answer: 1, why: 'The model only emits a structured request; your code validates and executes it.' },
      { q: 'What problem does MCP mainly solve?', options: ['Hallucinations', 'Custom integrations between every AI app and every tool (N×M)', 'Token pricing', 'Temperature tuning'], answer: 1, why: 'A shared protocol lets one server per tool work with many AI apps (N+M).' },
      { q: 'The model invents an application ID to call a tool. Best fix?', options: ['Higher temperature', 'Clear tool descriptions + argument validation + asking the user when info is missing', 'Remove all tools', 'Use a bigger model only'], answer: 1, why: 'Good descriptions, validation and a “ask when missing” instruction prevent invented arguments.' },
    ],
    keyTerms: ['Tool / function calling', 'MCP (Model Context Protocol)', 'AI agent', 'Prompt injection', 'Structured output'],
  },
  {
    id: 'multi-agent-patterns',
    levelId: 4,
    title: 'Multi-Agent Patterns: Router, Sequential, Orchestrator-Workers',
    summary: 'When to split work across several specialised agents — and when one well-designed agent is better.',
    minutes: 12,
    analogy: {
      title: 'How a hospital organises work',
      story: [
        'For a simple cough, one general physician handles everything. That is a single agent — simplest to build and debug.',
        'In a big hospital, a triage nurse first decides where you go: cardiology, orthopaedics or emergency. That is the router pattern. For a planned surgery there is an assembly line: registration → tests → anaesthesia → surgery → recovery, each step handing over to the next. That is the sequential pattern.',
        'For a complex case, a lead surgeon breaks the work down, delegates to the anaesthetist, nurses and radiologist in parallel, then combines everything into one decision. That is orchestrator–workers. More specialists can mean better care — but also more handovers, more meetings and more places for information to get lost.',
      ],
      mapping: [
        { everyday: 'General physician doing everything', ai: 'Single agent' },
        { everyday: 'Triage nurse', ai: 'Router: classify and dispatch' },
        { everyday: 'Assembly line of departments', ai: 'Sequential pipeline / prompt chain' },
        { everyday: 'Lead surgeon delegating in parallel', ai: 'Orchestrator–workers' },
        { everyday: 'Information lost in handovers', ai: 'Context loss & error compounding between agents' },
      ],
      oneLiner: 'Use the simplest pattern that meets quality targets — add agents only when specialisation or parallelism clearly pays for the coordination cost.',
    },
    diagram: {
      caption: 'The common patterns, from simplest to most complex.',
      nodes: [
        { id: 'single', label: 'Single agent', sub: 'one loop', icon: Bot },
        { id: 'router', label: 'Router', sub: 'classify → dispatch', icon: Split },
        { id: 'seq', label: 'Sequential', sub: 'step → step → step', icon: ListOrdered },
        { id: 'orch', label: 'Orchestrator', sub: 'plans & delegates', icon: Network },
        { id: 'workers', label: 'Workers', sub: 'parallel sub-tasks', icon: Users },
        { id: 'eval', label: 'Evaluator', sub: 'checks output', icon: ClipboardCheck },
      ],
      steps: [
        { title: 'Single agent: start here', body: 'One model, one system prompt, a handful of tools. Easy to trace and evaluate. Many “multi-agent” projects would be better as one well-prompted agent.', active: ['single'] },
        { title: 'Router: send each request to a specialist', body: 'A cheap, fast classifier decides the type of request and dispatches it to a specialised prompt or agent (pensions, passports, grievances). Great for wide-scope assistants.', active: ['router'], peek: 'route("my pension is late") → pensions_agent (confidence 0.94)\nroute("hello") → small_talk (handled by small model)' },
        { title: 'Sequential: a fixed chain of steps', body: 'Each step’s output feeds the next: extract → validate → draft → translate. Predictable and easy to test step by step; errors early in the chain propagate.', active: ['seq'], peek: 'extract_fields → check_eligibility → draft_letter → translate_hi' },
        { title: 'Orchestrator–workers: dynamic delegation', body: 'A lead agent breaks a complex task into sub-tasks at run time, sends them to workers (often in parallel), then synthesises. Powerful for research and analysis; expensive and harder to debug.', active: ['orch', 'workers'], peek: 'orchestrator: "Summarise 12 audit reports by risk theme"\n→ 12 workers (1 per report) in parallel → merge → brief' },
        { title: 'Evaluator / reviewer agents', body: 'A separate agent (or LLM judge) checks outputs against a rubric and sends them back for revision. Adds cost and latency but can raise quality on high-stakes outputs.', active: ['eval'] },
      ],
    },
    sandboxTitle: 'Match the pattern to the task',
    sandboxIntro: 'Choose a task and an architecture pattern. Compare quality, latency, cost and debuggability — and see which pattern a pragmatic architect would pick.',
    pmLens: {
      whenToUse: [
        'Router: many distinct request types with different tools, data or policies.',
        'Sequential: well-understood processes with clear stages and hand-offs.',
        'Orchestrator–workers: complex, decomposable tasks (multi-document research, large analyses).',
        'Single agent: everything else — and always the baseline to beat.',
      ],
      costLatency: [
        'Every extra agent adds at least one LLM call; orchestrator patterns can use 5–15× the tokens of a single agent.',
        'Parallel workers reduce wall-clock time but not cost.',
        'Routers can reduce cost by sending easy requests to smaller models.',
      ],
      failureModes: [
        'Error compounding: 5 steps at 95% accuracy each ≈ 77% end to end.',
        'Context lost between agents (“the drafting agent never saw the eligibility exception”).',
        'Impossible debugging without step-level traces.',
        'Architecture chosen for the demo video rather than the problem.',
      ],
      questions: [
        'What measurable improvement does the multi-agent design give over a single agent on our golden dataset?',
        'Do we have step-level tracing showing each agent’s inputs, outputs and cost?',
        'Where can errors compound, and where do we validate between steps?',
      ],
    },
    quiz: [
      { q: 'A citizen helpdesk handles pensions, passports and land records with different tools each. Natural first pattern?', options: ['Orchestrator–workers', 'Router to specialised agents', 'One agent with 60 tools', 'No AI'], answer: 1, why: 'A router dispatches each request to a focused specialist with the right tools.' },
      { q: 'Four sequential steps each have 90% accuracy. Roughly what is end-to-end accuracy?', options: ['90%', '~66%', '~99%', '45%'], answer: 1, why: '0.9⁴ ≈ 0.66 — errors compound across steps.' },
      { q: 'What should every multi-agent design be compared against?', options: ['A competitor’s demo', 'A well-designed single-agent baseline on the same evals', 'Nothing', 'A rules engine only'], answer: 1, why: 'Extra agents must earn their cost and complexity with measurable gains.' },
    ],
    keyTerms: ['Router pattern', 'Orchestrator–workers', 'AI agent', 'Evals', 'Model router'],
  },
  {
    id: 'hitl-design',
    levelId: 4,
    title: 'Designing Human-in-the-Loop (HITL) Approval & Fallback UX',
    summary: 'Confidence thresholds, review queues, approve/edit/reject screens and graceful fallbacks — how humans and AI share decisions safely.',
    minutes: 12,
    analogy: {
      title: 'How a bank clears cheques',
      story: [
        'A bank clears thousands of cheques a day. Small, routine cheques with clean signatures clear automatically. A large cheque, an unusual payee or a slightly odd signature goes to a branch officer, who sees exactly why it was flagged and can approve, ask for correction, or reject.',
        'The bank chooses where to draw that line. Set it too low and fraud slips through automatically; set it too high and officers drown in routine cheques and customers wait days. The right line depends on the cost of a mistake versus the cost of a review.',
        'And when the clearing system is down, the bank does not stop — there is a manual process. That is fallback UX. AI systems that affect citizens or customers need exactly the same design: thresholds, review screens with evidence, audit trails and a plan B.',
      ],
      mapping: [
        { everyday: 'Routine cheques cleared automatically', ai: 'High-confidence AI decisions auto-actioned' },
        { everyday: 'Cheques flagged for the officer', ai: 'Low-confidence cases routed to a review queue' },
        { everyday: 'Where the bank draws the line', ai: 'Confidence threshold' },
        { everyday: 'Officer sees why it was flagged', ai: 'Reviewer UI with evidence and reasons' },
        { everyday: 'Manual process when systems are down', ai: 'Fallback UX' },
      ],
      oneLiner: 'Put humans where mistakes are expensive, give them the evidence to decide fast, and feed their decisions back into evaluation.',
    },
    diagram: {
      caption: 'A production HITL flow for AI-assisted decisions.',
      nodes: [
        { id: 'ai', label: 'AI decision', sub: '+ confidence', icon: Bot },
        { id: 'gate', label: 'Threshold gate', sub: 'auto vs. review', icon: Gauge },
        { id: 'split', label: 'Auto-action', sub: 'low-risk only', icon: SplitSquareHorizontal },
        { id: 'queue', label: 'Review queue', sub: 'prioritised', icon: Inbox },
        { id: 'review', label: 'Reviewer UI', sub: 'approve · edit · reject', icon: UserCheck },
        { id: 'audit', label: 'Audit & learn', sub: 'logs → evals', icon: ScrollText },
      ],
      steps: [
        { title: 'The AI proposes a decision with a confidence score', body: 'Confidence can come from the model, from rule checks, or from agreement between signals (documents match, policy rules pass). It must be calibrated: 0.9 should mean right ~90% of the time.', active: ['ai'], peek: 'decision: APPROVE_RENEWAL\nconfidence: 0.81 = 0.4×doc_match + 0.35×policy_checks + 0.25×history' },
        { title: 'A threshold gate decides who acts', body: 'Above the auto-action threshold (and only for low-risk action types) the system proceeds. Below it, the case goes to a human. High-impact actions (rejections, payments, legal effects) may always require a human.', active: ['gate'], peek: 'if action in ["REJECT", "PAYMENT"] → always human\nelif confidence ≥ 0.92 → auto\nelse → review queue' },
        { title: 'Auto-actioned cases are still sampled', body: 'A small random sample of auto-approved cases is reviewed to catch silent errors and calibration drift.', active: ['split'] },
        { title: 'Reviewers see evidence, not just a verdict', body: 'Good review UX shows the AI’s recommendation, the reasons, the source documents with highlights, and one-click Approve / Edit / Reject. Avoid rubber-stamping: show disagreement signals and require reasons for overrides.', active: ['queue', 'review'], peek: 'Recommendation: APPROVE (0.81)\n⚠ Address on Aadhaar ≠ address on form (street name differs)\n[Approve] [Edit decision] [Reject + reason]' },
        { title: 'Everything is logged and learned from', body: 'Each decision, reviewer action and override is logged for audit. Overrides become new golden-dataset cases, and threshold settings are revisited with real data.', active: ['audit'], peek: 'override_rate last 30 days: 7.4%  (target < 10%)\n→ 41 new golden cases added' },
      ],
    },
    sandboxTitle: 'Where do you draw the line?',
    sandboxIntro: '300 simulated verification cases, each with an AI confidence score. Move the auto-approve threshold and see errors that slip through vs. the human workload — then make the model’s confidence less reliable.',
    pmLens: {
      whenToUse: [
        'Any decision that materially affects a citizen, customer, employee or money.',
        'Early rollout of any AI workflow — start with 100% review, then relax thresholds using data.',
        'Regulated contexts (EU AI Act high-risk systems require human oversight).',
      ],
      costLatency: [
        'Each human review costs reviewer time (₹ per case) and adds hours/days of latency.',
        'Lower thresholds cut workload but raise error cost; model this explicitly.',
        'Good reviewer UX (evidence, highlights, shortcuts) can halve review time.',
      ],
      failureModes: [
        'Automation bias: reviewers rubber-stamp AI recommendations.',
        'Uncalibrated confidence: the model is “99% sure” and wrong.',
        'No fallback when the AI service is down — the whole process stops.',
        'Overrides not captured → the system never improves.',
      ],
      questions: [
        'How was the auto-action threshold chosen, and what error rate does it imply at our volume?',
        'Is the confidence score calibrated — what is the accuracy in each confidence band?',
        'What happens to users when the AI service is unavailable or unsure?',
      ],
    },
    quiz: [
      { q: 'Raising the auto-approve threshold from 0.80 to 0.95 usually…', options: ['Increases errors slipping through and reduces review workload', 'Reduces errors slipping through but increases review workload', 'Has no effect', 'Makes the model smarter'], answer: 1, why: 'A stricter threshold sends more cases to humans, catching more errors at higher review cost.' },
      { q: 'What makes reviewer UX effective?', options: ['Only showing the AI verdict', 'Showing recommendation, reasons, highlighted evidence and quick approve/edit/reject', 'Hiding the AI recommendation entirely in all cases', 'Long forms'], answer: 1, why: 'Evidence and reasons let reviewers decide quickly and resist rubber-stamping.' },
      { q: 'Why log reviewer overrides?', options: ['For fun', 'They reveal AI errors and become new golden-dataset cases', 'They are required by the model', 'To slow reviewers down'], answer: 1, why: 'Overrides are the richest signal for improving prompts, retrieval and thresholds.' },
    ],
    keyTerms: ['Human-in-the-loop (HITL)', 'Confidence threshold', 'Fallback UX', 'Audit log', 'Golden dataset'],
  },
];

