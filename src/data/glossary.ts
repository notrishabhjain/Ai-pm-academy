export interface GlossaryTerm {
  term: string;
  def: string;
  level: number;
  lesson?: string;
  aka?: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  // Level 0
  { term: 'Artificial Intelligence (AI)', def: 'Umbrella term for software that performs tasks we associate with human judgement — recognising, predicting, generating, deciding.', level: 0, lesson: 'ai-landscape' },
  { term: 'Rules-based system', def: 'Software that follows explicit if/then logic written by people. Cheap, predictable, auditable — but brittle when inputs vary.', level: 0, lesson: 'ai-landscape' },
  { term: 'Machine Learning (ML)', def: 'Systems that learn patterns from historical examples instead of hand-written rules (e.g. predicting loan default from past loans).', level: 0, lesson: 'ai-landscape' },
  { term: 'Deep Learning', def: 'ML using large neural networks with many layers; excels at unstructured data like images, audio and text.', level: 0, lesson: 'ai-landscape' },
  { term: 'Generative AI (GenAI)', def: 'Models that create new content — text, images, code — rather than only classifying or predicting a number.', level: 0, lesson: 'ai-landscape' },
  { term: 'Supervised learning', def: 'Learning from labelled examples (input + correct answer). Most business ML is supervised.', level: 0, lesson: 'learning-types' },
  { term: 'Unsupervised learning', def: 'Finding structure (clusters, anomalies) in data with no labels.', level: 0, lesson: 'learning-types' },
  { term: 'Reinforcement learning (RL)', def: 'Learning by trial and error from rewards. Used to make LLMs more helpful (RLHF).', level: 0, lesson: 'learning-types' },
  { term: 'RLHF', def: 'Reinforcement Learning from Human Feedback — humans rank model answers and the model is tuned to prefer the higher-ranked style.', level: 0, lesson: 'learning-types', aka: 'Reinforcement Learning from Human Feedback' },
  { term: 'Label', def: 'The “correct answer” attached to a training example (e.g. spam / not spam). Labels cost money and time.', level: 0, lesson: 'learning-types' },
  { term: 'Training', def: 'The expensive, one-off (or periodic) process where a model learns its parameters from data.', level: 0, lesson: 'training-vs-inference' },
  { term: 'Inference', def: 'Using a trained model to answer a request. You pay for inference on every single call — it is your running cost.', level: 0, lesson: 'training-vs-inference' },
  { term: 'Parameters / weights', def: 'The billions of numbers inside a model that store what it learned. “70B model” = 70 billion parameters.', level: 0, lesson: 'training-vs-inference' },
  { term: 'Knowledge cutoff', def: 'The date after which a model has seen no training data. It cannot know later events unless you give them to it.', level: 0, lesson: 'training-vs-inference' },
  { term: 'Deterministic', def: 'Same input → same output, every time. Traditional software and calculators.', level: 0, lesson: 'deterministic-vs-probabilistic' },
  { term: 'Probabilistic', def: 'Output is sampled from likelihoods, so the same input can produce different outputs. All LLMs are probabilistic.', level: 0, lesson: 'deterministic-vs-probabilistic' },
  // Level 1
  { term: 'Large Language Model (LLM)', def: 'A deep neural network trained on huge amounts of text to predict the next token; the engine behind chat assistants.', level: 1, lesson: 'next-token-hallucination' },
  { term: 'Token', def: 'The unit an LLM reads and writes — a word, part of a word, or punctuation. ~4 English characters ≈ 1 token. You are billed per token.', level: 1, lesson: 'tokenization' },
  { term: 'Tokenizer', def: 'The component that splits text into tokens using a fixed vocabulary (often Byte-Pair Encoding).', level: 1, lesson: 'tokenization' },
  { term: 'BPE (Byte-Pair Encoding)', def: 'A tokenisation method that merges frequent character pairs into vocabulary entries. Common words become one token; rare words split into fragments.', level: 1, lesson: 'tokenization' },
  { term: 'Token tax', def: 'Non-English languages (e.g. Hindi, Tamil) often need 2–4× more tokens for the same meaning, which raises cost and latency.', level: 1, lesson: 'tokenization' },
  { term: 'Embedding', def: 'A list of numbers (a vector) that represents meaning. Similar meanings land close together in vector space.', level: 1, lesson: 'embeddings' },
  { term: 'Vector space', def: 'The multi-dimensional “map of meaning” where embeddings live.', level: 1, lesson: 'embeddings' },
  { term: 'Cosine similarity', def: 'A 0–1 score (for typical embeddings) of how closely two vectors point in the same direction — the standard “how similar in meaning?” measure.', level: 1, lesson: 'embeddings' },
  { term: 'Context window', def: 'The maximum number of tokens (prompt + history + documents + answer) a model can consider in one call.', level: 1, lesson: 'context-attention' },
  { term: 'Attention', def: 'The mechanism that lets each token “look at” other tokens to decide what matters for the next prediction.', level: 1, lesson: 'context-attention' },
  { term: 'Lost in the middle', def: 'Models recall facts at the start and end of a long context better than facts buried in the middle.', level: 1, lesson: 'context-attention' },
  { term: 'Next-token prediction', def: 'An LLM’s only core skill: given the text so far, output a probability for every possible next token.', level: 1, lesson: 'next-token-hallucination' },
  { term: 'Hallucination', def: 'A fluent, confident output that is factually wrong or unsupported by the provided sources.', level: 1, lesson: 'next-token-hallucination' },
  { term: 'Logits', def: 'Raw scores the model assigns to each candidate token before they are turned into probabilities by softmax.', level: 1, lesson: 'next-token-hallucination' },
  // Level 2
  { term: 'System prompt', def: 'Hidden, developer-written instructions that set the model’s role, rules, tone and boundaries for every conversation.', level: 2, lesson: 'prompt-roles' },
  { term: 'User prompt', def: 'The message the end user types. Untrusted input — it may try to override your rules.', level: 2, lesson: 'prompt-roles' },
  { term: 'Few-shot prompting', def: 'Including a handful of worked input→output examples in the prompt so the model copies the pattern.', level: 2, lesson: 'prompt-roles' },
  { term: 'Zero-shot', def: 'Asking the model to do a task with instructions only, no examples.', level: 2, lesson: 'prompt-roles' },
  { term: 'Temperature', def: 'Sampling knob (0–1+) controlling randomness. 0 = most likely token every time; higher = more varied/creative, more risk.', level: 2, lesson: 'temperature-top-p' },
  { term: 'Top-P (nucleus sampling)', def: 'Only sample from the smallest set of tokens whose probabilities add up to P (e.g. 0.9), cutting off the long tail.', level: 2, lesson: 'temperature-top-p' },
  { term: 'Structured output', def: 'Forcing the model to reply in a machine-readable format (usually JSON matching a schema) so software can consume it.', level: 2, lesson: 'structured-outputs' },
  { term: 'JSON Schema', def: 'A contract describing required fields, types and allowed values of a JSON object. Used to validate model output.', level: 2, lesson: 'structured-outputs' },
  { term: 'Constrained decoding', def: 'Vendor feature that only lets the model emit tokens that keep the output valid against a schema — guarantees shape, not truth.', level: 2, lesson: 'structured-outputs' },
  { term: 'Frontier model', def: 'The most capable (and usually most expensive) closed models from leading labs.', level: 2, lesson: 'model-selection' },
  { term: 'Open-weights model', def: 'A model whose weights you can download and run on your own infrastructure — key for data sovereignty.', level: 2, lesson: 'model-selection' },
  { term: 'Reasoning / thinking model', def: 'A model that generates hidden “thinking” tokens before answering. Better at hard multi-step problems; slower and pricier.', level: 2, lesson: 'model-selection' },
  { term: 'Model router', def: 'A layer that sends easy requests to a cheap model and escalates hard ones to a stronger model.', level: 2, lesson: 'model-selection' },
  { term: 'Data sovereignty', def: 'Requirement that data stays within a jurisdiction or your own infrastructure (common in government and BFSI).', level: 2, lesson: 'model-selection' },
  // Level 3
  { term: 'RAG (Retrieval-Augmented Generation)', def: 'Retrieve relevant passages from your documents and paste them into the prompt so the model answers from your data with citations.', level: 3, lesson: 'rag-stages' },
  { term: 'Ingestion', def: 'Loading and cleaning source documents (PDFs, wikis, tickets) for a RAG pipeline.', level: 3, lesson: 'rag-stages' },
  { term: 'Chunking', def: 'Splitting documents into smaller passages. Chunk size and overlap strongly affect answer quality.', level: 3, lesson: 'rag-stages' },
  { term: 'Chunk overlap', def: 'Repeating some text between neighbouring chunks so facts that straddle a boundary are not cut in half.', level: 3, lesson: 'rag-stages' },
  { term: 'Vector database', def: 'A database optimised to store embeddings and find the nearest ones to a query quickly.', level: 3, lesson: 'rag-stages' },
  { term: 'Top-K', def: 'How many retrieved chunks are passed to the model. Too few misses facts; too many adds noise, cost and “lost in the middle”.', level: 3, lesson: 'rag-stages' },
  { term: 'Grounding', def: 'Making the model answer only from supplied sources, ideally with citations.', level: 3, lesson: 'rag-stages' },
  { term: 'BM25', def: 'Classic keyword-search ranking formula. Great for exact terms, IDs and acronyms; blind to synonyms.', level: 3, lesson: 'search-modes' },
  { term: 'Semantic / vector search', def: 'Finding passages by meaning using embeddings. Handles synonyms and paraphrase; can miss exact codes.', level: 3, lesson: 'search-modes' },
  { term: 'Hybrid search', def: 'Combining keyword and vector results (e.g. Reciprocal Rank Fusion) to get the best of both.', level: 3, lesson: 'search-modes' },
  { term: 'Reranker', def: 'A second-stage model that re-scores the top candidates more precisely before they go to the LLM.', level: 3, lesson: 'search-modes' },
  { term: 'Fine-tuning', def: 'Further training a model on your examples to change its behaviour, style or format. Poor at injecting fast-changing facts.', level: 3, lesson: 'rag-vs-finetune' },
  { term: 'Long-context prompting', def: 'Pasting entire documents into a very large context window instead of retrieving chunks. Simple, but costly per call.', level: 3, lesson: 'rag-vs-finetune' },
  // Level 4
  { term: 'AI agent', def: 'An LLM in a loop that plans, calls tools, observes results and decides the next step toward a goal.', level: 4, lesson: 'chatbot-vs-agent' },
  { term: 'ReAct', def: 'Reason + Act: the agent pattern of alternating Thought → Action (tool call) → Observation until done.', level: 4, lesson: 'chatbot-vs-agent' },
  { term: 'Tool / function calling', def: 'The model outputs a structured request (name + JSON arguments) for your code to execute, then reads the result.', level: 4, lesson: 'tool-calling-mcp' },
  { term: 'MCP (Model Context Protocol)', def: 'An open standard for connecting AI apps to tools and data sources via reusable “servers” — like USB-C for AI integrations.', level: 4, lesson: 'tool-calling-mcp' },
  { term: 'Router pattern', def: 'A classifier agent that sends each request to the right specialist agent or workflow.', level: 4, lesson: 'multi-agent-patterns' },
  { term: 'Orchestrator–workers', def: 'A lead agent breaks a task into sub-tasks, delegates to worker agents and merges results.', level: 4, lesson: 'multi-agent-patterns' },
  { term: 'Human-in-the-loop (HITL)', def: 'Designing points where a person reviews, edits or approves an AI action before it takes effect.', level: 4, lesson: 'hitl-design' },
  { term: 'Confidence threshold', def: 'The score above which an AI decision is auto-actioned and below which it is routed to a human.', level: 4, lesson: 'hitl-design' },
  { term: 'Fallback UX', def: 'What the user experiences when the AI is unsure, wrong or down — e.g. hand-off to a human, a form, or a safe default.', level: 4, lesson: 'hitl-design' },
  // Level 5
  { term: 'Evals', def: 'Systematic tests that score AI outputs on quality dimensions across a dataset — the AI equivalent of UAT.', level: 5, lesson: 'why-uat-fails' },
  { term: 'Golden dataset', def: 'A curated set of realistic inputs with expected answers / rubrics, agreed with business owners, used for every release.', level: 5, lesson: 'golden-dataset' },
  { term: 'Regression', def: 'A test case that used to pass and now fails after a change to prompt, model, data or config.', level: 5, lesson: 'golden-dataset' },
  { term: 'Code-based eval', def: 'A deterministic check written in code — JSON validity, regex, exact match, length, latency. Cheap and reliable.', level: 5, lesson: 'code-evals-vs-judge' },
  { term: 'LLM-as-a-judge', def: 'Using a (usually stronger) model with a rubric to grade another model’s output on fuzzy qualities like helpfulness or faithfulness.', level: 5, lesson: 'code-evals-vs-judge' },
  { term: 'RAG triad', def: 'Three RAG checks: Context Relevance (right chunks?), Faithfulness/Groundedness (answer supported?), Answer Relevance (answers the question?).', level: 5, lesson: 'rag-triad' },
  { term: 'Faithfulness / groundedness', def: 'Share of claims in the answer that are supported by the retrieved context.', level: 5, lesson: 'rag-triad' },
  { term: 'TTFT', def: 'Time To First Token — how long the user waits before text starts streaming. Drives perceived speed.', level: 5, lesson: 'token-finops', aka: 'Time To First Token' },
  { term: 'Prompt caching', def: 'Vendors charge far less (often ~90% off) for repeated prompt prefixes such as a long system prompt.', level: 5, lesson: 'token-finops' },
  { term: 'Token FinOps', def: 'The discipline of forecasting, monitoring and optimising token spend.', level: 5, lesson: 'token-finops' },
  { term: 'TCO', def: 'Total Cost of Ownership — tokens plus infrastructure, vector DB, monitoring, people and evaluation costs.', level: 5, lesson: 'token-finops', aka: 'Total Cost of Ownership' },
  // Level 6
  { term: 'AI PRD', def: 'Product Requirements Document for an AI feature: adds non-AI baseline, eval criteria, cost/latency guardrails and fallback UX to a normal PRD.', level: 6, lesson: 'ai-prd' },
  { term: 'Data spike', def: 'A time-boxed sprint to check whether the data needed actually exists, is accessible and is good enough.', level: 6, lesson: 'ai-sprints' },
  { term: 'Eval sprint', def: 'A sprint dedicated to building the golden dataset and eval harness before (or alongside) feature work.', level: 6, lesson: 'ai-sprints' },
  { term: 'Non-AI baseline', def: 'How well the simplest non-AI solution (rules, search, a form) performs. AI must beat it to justify its cost.', level: 6, lesson: 'ai-prd' },
  { term: 'Prompt injection', def: 'Malicious input that tries to override the system prompt (“ignore previous instructions…”), possibly hidden inside documents.', level: 6, lesson: 'security-governance' },
  { term: 'PII masking', def: 'Detecting and redacting personal data (Aadhaar, PAN, phone, email) before it reaches a model or logs.', level: 6, lesson: 'security-governance' },
  { term: 'Guardrails', def: 'Input/output checks around the model — injection filters, PII redaction, topic limits, toxicity and schema checks.', level: 6, lesson: 'security-governance' },
  { term: 'Audit log', def: 'Tamper-evident record of prompts, retrieved sources, outputs, model version and human decisions.', level: 6, lesson: 'security-governance' },
  { term: 'DPDP Act 2023', def: 'India’s Digital Personal Data Protection Act: consent, purpose limitation, data minimisation, breach notification and data-principal rights.', level: 6, lesson: 'security-governance' },
  { term: 'EU AI Act', def: 'EU regulation that classifies AI systems by risk (unacceptable, high, limited, minimal) with obligations scaling by risk.', level: 6, lesson: 'security-governance' },
  { term: 'Spec-driven development', def: 'Writing precise, testable specifications (acceptance criteria, examples, constraints) that humans and AI coding agents build against.', level: 6, lesson: 'spec-driven-dev' },
];

export interface CheatSheetSection {
  title: string;
  items: { k: string; v: string }[];
}

export const CHEAT_SHEET: CheatSheetSection[] = [
  {
    title: 'Pick the simplest technology that works',
    items: [
      { k: 'Fixed, auditable logic', v: 'Rules / SQL — cheapest, deterministic, explainable.' },
      { k: 'Predict a number or category from tables', v: 'Classical ML — needs labelled history.' },
      { k: 'Understand / generate language, messy inputs', v: 'GenAI / LLM — powerful, probabilistic, priced per token.' },
    ],
  },
  {
    title: 'Rules of thumb',
    items: [
      { k: '1 token', v: '≈ 4 English characters ≈ ¾ of a word. Hindi/Indic scripts: often 2–4× more tokens.' },
      { k: 'Output tokens', v: 'Typically cost 4–5× input tokens. Cap max output length.' },
      { k: 'Prompt caching', v: 'Repeated prefix (system prompt, policy docs) often ~90% cheaper.' },
      { k: 'Temperature', v: '0–0.3 for extraction & facts; 0.7+ only for brainstorming / creative.' },
      { k: 'Top-K chunks', v: 'Start with 3–5. Measure — do not guess.' },
    ],
  },
  {
    title: 'Prompting vs RAG vs Fine-tuning vs Long context',
    items: [
      { k: 'Prompting', v: 'Behaviour & format changes. Start here. Hours.' },
      { k: 'RAG', v: 'Private or fast-changing knowledge with citations. Days–weeks.' },
      { k: 'Fine-tuning', v: 'Consistent style/format at scale, narrow skills, smaller-model distillation. Weeks + data.' },
      { k: 'Long context', v: 'Few, small, rarely-repeated documents. Simple but expensive per call.' },
    ],
  },
  {
    title: 'The RAG triad (diagnose before you fix)',
    items: [
      { k: 'Context relevance low', v: 'Retrieval problem → chunking, hybrid search, reranker, metadata filters.' },
      { k: 'Faithfulness low', v: 'Generation problem → stricter grounding prompt, citations, lower temperature.' },
      { k: 'Answer relevance low', v: 'Understanding problem → query rewriting, clarifying questions, better instructions.' },
    ],
  },
  {
    title: 'AI release gate (example)',
    items: [
      { k: 'Golden dataset pass rate', v: '≥ 90% overall, 100% on safety / adversarial cases.' },
      { k: 'Faithfulness', v: '≥ 0.85 average; zero unsupported claims on regulated answers.' },
      { k: 'Latency', v: 'p95 total under SLA (e.g. ≤ 3s); TTFT ≤ 1s for chat.' },
      { k: 'Cost', v: 'Within ₹/query budget with 30% headroom for growth.' },
    ],
  },
  {
    title: 'Governance must-haves',
    items: [
      { k: 'Prompt injection', v: 'Treat all user and document text as untrusted; separate instructions from data.' },
      { k: 'PII', v: 'Mask before the model and before logs; purpose-limit and retain minimally (DPDP).' },
      { k: 'Audit trail', v: 'Log model version, prompt version, sources, output and human decision.' },
      { k: 'Human oversight', v: 'HITL for high-impact decisions affecting citizens/customers (EU AI Act high-risk).' },
    ],
  },
];
