import { Type, Scissors, BookA, Hash, Receipt, FileText, Cpu, Sigma, Map, Ruler, Search, ScrollText, History, Files, MessageCircleQuestion, Eye, MessageCircle, BarChart3, Dice5, Repeat, TriangleAlert } from 'lucide-react';
import type { Lesson } from '../types';

export const level1Lessons: Lesson[] = [
  {
    id: 'tokenization',
    levelId: 1,
    title: 'Tokenization — why AI reads fragments, not words',
    summary: 'LLMs read and bill in “tokens”. Learn why common words are cheap, rare names and Indian languages are expensive, and how that hits your budget.',
    minutes: 10,
    analogy: {
      title: 'Building sentences from a fixed box of LEGO bricks',
      story: [
        'Imagine the model owns one giant box containing about 100,000 different LEGO bricks — and it can only build sentences out of those bricks. Very common words like “the”, “passport” or “application” each have their own ready-made brick.',
        'Rare words do not. “Thiruvananthapuram” has no single brick, so the model snaps together five or six smaller pieces: “Thi” + “ruv” + “ana” + … Numbers get chopped into groups of three digits. Many non-English scripts, such as Hindi or Tamil, were less common in training, so they are often built from many tiny bricks.',
        'Here is the money part: the model provider charges you per brick, both for the bricks you send and the bricks it sends back. Same meaning, more bricks, bigger bill — and a slower answer, because the model places one brick at a time.',
      ],
      mapping: [
        { everyday: 'The fixed box of bricks', ai: 'The tokenizer vocabulary (~50k–200k tokens)' },
        { everyday: 'One brick', ai: 'One token (≈ 4 English characters)' },
        { everyday: 'Snapping small bricks together for rare words', ai: 'Sub-word splitting (Byte-Pair Encoding)' },
        { everyday: 'Price per brick', ai: 'Price per 1M input / output tokens' },
        { everyday: 'Hindi needing many tiny bricks', ai: 'The “token tax” on non-English languages' },
      ],
      oneLiner: 'Tokens are the model’s unit of reading, writing, memory limits and billing — so token count is a core product metric.',
    },
    diagram: {
      caption: 'Follow one sentence from raw text to a billable token count.',
      nodes: [
        { id: 'text', label: 'Raw text', sub: '“My passport is delayed”', icon: Type },
        { id: 'pre', label: 'Pre-split', sub: 'spaces & punctuation', icon: Scissors },
        { id: 'vocab', label: 'Vocabulary match', sub: 'BPE merges', icon: BookA },
        { id: 'ids', label: 'Token IDs', sub: 'numbers', icon: Hash },
        { id: 'bill', label: 'Count & bill', sub: 'per 1M tokens', icon: Receipt },
      ],
      steps: [
        { title: 'Start with raw text', body: 'The user types a sentence. To the model, this is just a string of characters — it cannot read letters directly.', active: ['text'], peek: '"My passport renewal from Thiruvananthapuram is delayed."' },
        { title: 'Pre-split on spaces and punctuation', body: 'The tokenizer first breaks text at spaces and punctuation. Most tokenizers glue the leading space onto the following word, so “ passport” (with a space) is one unit.', active: ['text', 'pre'], peek: '["My", " passport", " renewal", " from", " Thiruvananthapuram", " is", " delayed", "."]' },
        { title: 'Match pieces against the vocabulary', body: 'Each piece is matched against a learned vocabulary. Frequent words map to one token. Rare words are split into the largest known fragments — this is Byte-Pair Encoding (BPE).', active: ['pre', 'vocab'], peek: '" Thiruvananthapuram" → [" Thi", "ruv", "ana", "nth", "apu", "ram"]\n" renewal" → [" renew", "al"]' },
        { title: 'Convert to token IDs', body: 'Every token has an ID number. The model only ever sees these numbers. Its output is also a sequence of IDs that get turned back into text.', active: ['ids'], peek: '[5159, 26818, 43638, 278, 505, 84, 1106, 316, 40477, 460, 374, 23540, 13]' },
        { title: 'Count tokens — that is your bill, your latency and your limit', body: 'Input tokens and output tokens are counted separately and billed per million. The same count also determines whether you fit in the context window and how long generation takes.', active: ['bill'], peek: 'input: 13 tokens × $3 / 1M  = $0.000039\noutput: 120 tokens × $15 / 1M = $0.0018  ← output is pricier' },
      ],
    },
    sandboxTitle: 'Same meaning, different token bills',
    sandboxIntro: 'Pick a category of text and watch how the tokenizer splits it. Compare tokens-per-word for everyday English, rare place names, ID numbers, Hindi and JSON.',
    pmLens: {
      whenToUse: [
        'Estimate token volumes in every AI business case: tokens per request × requests per month.',
        'Measure token counts on real samples in each language your users speak — not English test data only.',
        'Use token counts to size context windows, chunk sizes and max-output limits.',
      ],
      costLatency: [
        'Rule of thumb: 1 token ≈ 4 English characters ≈ 0.75 words.',
        'Indic languages can cost 2–4× more tokens than English for the same meaning (varies by model).',
        'Output tokens are usually 4–5× pricier than input tokens and are generated one at a time (latency).',
        'Long IDs, URLs and JSON keys are token-hungry — avoid stuffing them into prompts unnecessarily.',
      ],
      failureModes: [
        'Budgets built on English token estimates for a Hindi-first citizen service.',
        'Truncation: long prompts silently cut off because the token limit, not character limit, was exceeded.',
        'Spelling/character-level tasks (counting letters, reversing IDs) fail because the model sees fragments.',
      ],
      questions: [
        'What is our measured average input and output token count per request, by language?',
        'Have we compared tokenizers across candidate models for our main languages?',
        'What max-output-token limit are we setting, and why that number?',
      ],
    },
    quiz: [
      { q: 'Roughly how many tokens is 1,000 English words?', options: ['~250', '~1,300', '~10,000', 'Exactly 1,000'], answer: 1, why: '1 token ≈ 0.75 words, so 1,000 words ≈ 1,300 tokens.' },
      { q: 'Why might a Hindi chatbot cost more than an English one with identical traffic?', options: ['Hindi servers are pricier', 'The same meaning often takes more tokens in Hindi', 'Hindi requires a reasoning model', 'It does not cost more'], answer: 1, why: 'Many tokenizers split Indic scripts into more, smaller tokens — the “token tax”.' },
      { q: 'Which tokens are typically more expensive?', options: ['Input tokens', 'Output tokens', 'They are always equal', 'Space tokens'], answer: 1, why: 'Output tokens are generated one at a time with more compute and are priced several times higher.' },
    ],
    keyTerms: ['Token', 'Tokenizer', 'BPE (Byte-Pair Encoding)', 'Token tax', 'Context window'],
  },
  {
    id: 'embeddings',
    levelId: 1,
    title: 'Embeddings & Vector Space — coordinates of meaning',
    summary: 'How text becomes a list of numbers that captures meaning, so software can find “similar” things even when the words differ.',
    minutes: 12,
    analogy: {
      title: 'GPS coordinates on a map of meaning',
      story: [
        'Picture a huge city where every idea has a home address. All the travel ideas — passport, visa, boarding pass — live in the same neighbourhood. Energy ideas — solar inverter, battery, power grid — live across town. Two ideas that mean similar things live on the same street.',
        'An embedding is simply the GPS coordinate of a piece of text on this map. Instead of 2 numbers (latitude, longitude), real embeddings use 768 to 3,000 numbers, so the map has thousands of “directions” — formality, topic, sentiment, whether something is a person or a document, and many directions no human has names for.',
        'Once everything has coordinates, “find similar” becomes “find the nearest neighbours”. Search for “lost my travel document” and you land next to “passport reissue” even though the words do not overlap. That is the engine inside semantic search and RAG.',
      ],
      mapping: [
        { everyday: 'Home address on the map', ai: 'Embedding vector' },
        { everyday: 'Neighbourhood of related places', ai: 'Cluster of similar meanings in vector space' },
        { everyday: 'Distance / direction between two homes', ai: 'Cosine similarity (0 = unrelated, 1 = same meaning)' },
        { everyday: 'Asking “what’s near me?”', ai: 'Nearest-neighbour (vector) search' },
      ],
      oneLiner: 'Embeddings turn meaning into geometry, so “similar meaning” becomes “close together”.',
    },
    diagram: {
      caption: 'How a sentence becomes a point in vector space and gets compared with others.',
      nodes: [
        { id: 'text', label: 'Text', sub: '“lost my passport”', icon: FileText },
        { id: 'model', label: 'Embedding model', sub: 'neural network', icon: Cpu },
        { id: 'vec', label: 'Vector', sub: '[0.12, −0.8, …]', icon: Sigma },
        { id: 'space', label: 'Vector space', sub: 'map of meaning', icon: Map },
        { id: 'sim', label: 'Similarity', sub: 'cosine score', icon: Ruler },
        { id: 'use', label: 'Use it', sub: 'search · RAG · dedupe', icon: Search },
      ],
      steps: [
        { title: 'Feed text into an embedding model', body: 'An embedding model is a smaller neural network trained so that texts with similar meaning produce similar numbers. It is a different (cheaper) model from the chat LLM.', active: ['text', 'model'] },
        { title: 'Out comes a vector', body: 'The result is a fixed-length list of numbers — e.g. 1,024 values — regardless of whether the input was one word or a paragraph.', active: ['model', 'vec'], peek: 'embed("lost my passport") →\n[0.021, -0.113, 0.387, 0.004, -0.296, … 1,019 more]' },
        { title: 'Every vector is a point in space', body: 'Imagine each vector as a point on a map with 1,024 directions. Points for related meanings cluster together. We can squash it down to 2D to visualise it (as in Lab 1B).', active: ['vec', 'space'] },
        { title: 'Compare with cosine similarity', body: 'Cosine similarity measures the angle between two vectors. Pointing the same way → close to 1.0. Unrelated → close to 0. It ignores length and focuses on direction (meaning).', active: ['space', 'sim'], peek: 'cos("lost my passport", "passport reissue") = 0.91\ncos("lost my passport", "solar inverter")   = 0.08' },
        { title: 'Put it to work', body: 'Semantic search, RAG retrieval, duplicate-ticket detection, recommendations and clustering all rely on embeddings. Store millions of them in a vector database and query by meaning.', active: ['use'] },
      ],
    },
    sandboxTitle: 'Vector arithmetic: meaning you can add and subtract',
    sandboxIntro: 'Each word below has a small vector (hover the bars to see its dimensions). Compute A − B + C and see which word lands nearest. This is why embeddings capture relationships, not just keywords.',
    pmLens: {
      whenToUse: [
        'Semantic search over policies, FAQs, tickets or case files where users phrase things differently.',
        'Detecting duplicate or near-duplicate grievances, tickets or applications.',
        'Clustering feedback into themes; recommendations (“similar schemes you may be eligible for”).',
      ],
      costLatency: [
        'Embedding calls are cheap (often 10–100× cheaper than chat tokens) — but you embed every document chunk once and every query each time.',
        'Re-embedding your whole corpus is required when you switch embedding models — budget for it.',
        'Vector DB storage and query latency (usually 10–100 ms) are part of TCO.',
      ],
      failureModes: [
        'Exact identifiers (form numbers, section codes) are poorly captured — combine with keyword search.',
        'Embedding model weak in your language (e.g. Hinglish) → bad retrieval.',
        'Mixing vectors from two different embedding models in one index produces garbage similarities.',
      ],
      questions: [
        'Which embedding model are we using, and how was it evaluated on our languages and domain?',
        'What is our plan and cost to re-embed everything if we change the embedding model?',
        'Do we combine vector search with keyword search for IDs and codes?',
      ],
    },
    quiz: [
      { q: 'What does a cosine similarity close to 1.0 between two texts suggest?', options: ['They share no words', 'They have very similar meaning', 'One is longer', 'They are in different languages'], answer: 1, why: 'Cosine near 1 means the vectors point in nearly the same direction — similar meaning.' },
      { q: 'Why can semantic search find “passport reissue” when the user typed “lost my travel document”?', options: ['Keyword overlap', 'Their embeddings are close in vector space', 'The LLM memorised it', 'Luck'], answer: 1, why: 'Embeddings capture meaning, so paraphrases land near each other.' },
      { q: 'You switch to a new embedding model. What must you do?', options: ['Nothing', 'Re-embed all documents with the new model', 'Increase temperature', 'Fine-tune the chat model'], answer: 1, why: 'Vectors from different models live in different spaces and cannot be compared.' },
    ],
    keyTerms: ['Embedding', 'Vector space', 'Cosine similarity', 'Vector database', 'Semantic / vector search'],
  },
  {
    id: 'context-attention',
    levelId: 1,
    title: 'Context Windows, Attention & “Lost in the Middle”',
    summary: 'The model’s short-term memory has a hard size limit, and even within it, facts in the middle get less attention.',
    minutes: 12,
    analogy: {
      title: 'An open-book exam on a small desk',
      story: [
        'Imagine an open-book exam where you may bring any pages you like — but they must all fit on your small desk. Pages that do not fit fall on the floor and are gone. That desk is the context window: everything the model can “see” in one go — instructions, chat history, documents and its own answer.',
        'While writing each word of your answer, you glance back at the pages and highlight the lines that matter right now. That highlighter is attention — the mechanism that lets each new word focus on the most relevant earlier words.',
        'And if you have ever skimmed a 300-page report the night before a meeting, you know you remember the opening and the conclusion best — the middle blurs. Models behave the same way: facts buried in the middle of a long context are recalled less reliably. Researchers call it “lost in the middle”.',
      ],
      mapping: [
        { everyday: 'The size of the desk', ai: 'Context window (e.g. 128k or 1M tokens)' },
        { everyday: 'Pages falling on the floor', ai: 'Truncation — old history or documents dropped' },
        { everyday: 'Highlighter while writing', ai: 'Attention weights' },
        { everyday: 'Remembering the intro and conclusion best', ai: 'Lost-in-the-middle effect' },
      ],
      oneLiner: 'Everything must fit in the window, and position matters — put critical facts near the start or end, and send less, not more.',
    },
    diagram: {
      caption: 'What fills a context window during a real RAG chat request — and how attention reads it.',
      nodes: [
        { id: 'sys', label: 'System prompt', sub: 'rules & role', icon: ScrollText },
        { id: 'hist', label: 'Chat history', sub: 'previous turns', icon: History },
        { id: 'docs', label: 'Retrieved docs', sub: 'RAG chunks', icon: Files },
        { id: 'q', label: 'User question', sub: 'latest turn', icon: MessageCircleQuestion },
        { id: 'attn', label: 'Attention', sub: 'what to focus on', icon: Eye },
        { id: 'out', label: 'Answer', sub: 'also uses the window', icon: MessageCircle },
      ],
      steps: [
        { title: 'The system prompt goes first', body: 'Your instructions, persona and rules sit at the top of every request — often 500–3,000 tokens, sent (and billed) on every single call. A prime candidate for prompt caching.', active: ['sys'] },
        { title: 'Chat history accumulates', body: 'Every previous user message and model reply is re-sent each turn. A 20-turn conversation can be 10,000+ tokens. When the window fills, apps drop or summarise the oldest turns.', active: ['sys', 'hist'], peek: 'turn 1 … turn 18  →  9,400 tokens\nstrategy: summarise turns 1–12 into 400 tokens' },
        { title: 'Retrieved documents are inserted', body: 'RAG adds the top-K chunks from your knowledge base. More chunks = more chance the answer is in there, but also more noise, cost and the risk that the key chunk lands in the middle.', active: ['docs'] },
        { title: 'The user’s question comes last', body: 'The latest question is usually placed at the end, close to where generation starts — the position models attend to best.', active: ['q'] },
        { title: 'Attention decides what matters', body: 'For every token it generates, the model computes attention weights over all tokens in the window. Positions at the start and end typically receive more reliable attention than the middle of very long contexts.', active: ['attn', 'sys', 'q'], peek: 'attention to fact at position:\n  0–10%:  ████████ high\n 45–55%:  ███ weaker (lost in the middle)\n90–100%:  ████████ high' },
        { title: 'The answer must fit too', body: 'Output tokens share the same window. If the prompt uses 127k of a 128k window, the model only has 1k tokens left to answer. Set max output tokens deliberately.', active: ['out'], peek: 'window 128,000 = input 120,000 + output ≤ 8,000' },
      ],
    },
    sandboxTitle: 'Fill the desk & bury the fact',
    sandboxIntro: 'First, fill a context window with system prompt, chat history and documents and see what overflows. Then move a critical fact through a long document and watch the model’s chance of recalling it.',
    pmLens: {
      whenToUse: [
        'Size the context budget explicitly: system prompt + history + retrieved docs + expected output.',
        'Put critical rules at the beginning and repeat key constraints near the end of long prompts.',
        'Prefer retrieving 3–5 relevant chunks over dumping whole documents “because the window is big”.',
      ],
      costLatency: [
        'Every token in the window is billed on every call — a 100k-token context costs ~100× a 1k context.',
        'Longer inputs increase time-to-first-token (the model must read everything first).',
        'Prompt caching can cut repeated-prefix cost by up to ~90% — structure prompts so the static part comes first.',
      ],
      failureModes: [
        'Silent truncation of the oldest messages — the bot “forgets” the user’s name or earlier constraints.',
        'Key policy clause lands in the middle of 40 retrieved chunks and is ignored.',
        'Output cut off mid-sentence because the window was almost full.',
      ],
      questions: [
        'What is our token budget breakdown per request, and what happens when it overflows?',
        'How do we handle long conversations — truncate, summarise or store memory externally?',
        'Have we tested recall for facts placed in the middle of our longest realistic contexts?',
      ],
    },
    quiz: [
      { q: 'A model has a 128k-token window. Your prompt is 126k tokens. What is the risk?', options: ['None', 'Very little room left for the answer, which may be cut off', 'The model will be smarter', 'It costs less'], answer: 1, why: 'Input and output share the window; a nearly full window leaves little space to answer.' },
      { q: 'Where is a critical instruction least likely to be followed in a very long prompt?', options: ['At the very beginning', 'Buried in the middle', 'At the very end', 'Repeated at both ends'], answer: 1, why: 'The lost-in-the-middle effect: facts in the middle of long contexts get recalled less reliably.' },
      { q: 'Why does the system prompt affect cost on every call?', options: ['It is free', 'It is re-sent and billed with every request', 'It is only sent once per user', 'It is stored in the model'], answer: 1, why: 'LLM APIs are stateless; the full prompt, including system instructions, is sent each time (caching can discount it).' },
    ],
    keyTerms: ['Context window', 'Attention', 'Lost in the middle', 'Prompt caching', 'Top-K'],
  },
  {
    id: 'next-token-hallucination',
    levelId: 1,
    title: 'Next-Token Probability & Why Hallucinations Happen',
    summary: 'An LLM’s only skill is predicting the next likely token. When the right fact is missing, the most likely-sounding token is often a confident invention.',
    minutes: 12,
    analogy: {
      title: 'The quiz contestant who never says “pass”',
      story: [
        'Picture a quiz show where a blank answer always scores zero but a guess sometimes scores a point. A smart contestant learns to always say something confident. Ask them the capital of France and they say “Paris” instantly. Ask them the penalty in clause 14(b) of a policy they have never read, and they still answer — “₹10,000” — in exactly the same confident tone.',
        'Large Language Models were trained in a similar way. They learned to produce the most plausible continuation of text, and training rewarded fluent, complete answers. They have no built-in sense of “I actually read this” versus “this just sounds right”.',
        'So a hallucination is not a bug that will be patched next week; it is the system doing exactly what it was built for — predicting likely-sounding words — in a situation where likely-sounding and true are different things. Your job is to design around it: give the model the facts (grounding), let it say “I don’t know”, and check its claims.',
      ],
      mapping: [
        { everyday: 'Contestant’s instant answer', ai: 'Highest-probability next token' },
        { everyday: 'Same confident tone whether right or wrong', ai: 'Fluency is not a signal of accuracy' },
        { everyday: 'Rules that punish saying “pass”', ai: 'Training that rewards complete, helpful-sounding answers' },
        { everyday: 'Handing the contestant the rulebook', ai: 'Grounding with RAG / provided documents' },
      ],
      oneLiner: 'LLMs predict plausible text, not verified truth — hallucinations happen when the plausible answer and the true answer diverge.',
    },
    diagram: {
      caption: 'One generation step, from prompt to chosen token — and where a hallucination slips in.',
      nodes: [
        { id: 'prompt', label: 'Prompt', sub: 'text so far', icon: MessageCircleQuestion },
        { id: 'logits', label: 'Scores (logits)', sub: 'every token scored', icon: Sigma },
        { id: 'probs', label: 'Probabilities', sub: 'softmax', icon: BarChart3 },
        { id: 'pick', label: 'Pick a token', sub: 'sampling', icon: Dice5 },
        { id: 'loop', label: 'Append & repeat', sub: 'one token at a time', icon: Repeat },
        { id: 'hall', label: 'Hallucination?', sub: 'plausible ≠ true', icon: TriangleAlert },
      ],
      steps: [
        { title: 'Read the text so far', body: 'The model receives the prompt as tokens: “The late-filing penalty under Section 14(b) of the Rajasthan Solar Rooftop Policy is…”', active: ['prompt'] },
        { title: 'Score every possible next token', body: 'The network outputs a raw score (logit) for each of the ~100k tokens in its vocabulary — how well each would continue the text, based on patterns in training data.', active: ['prompt', 'logits'], peek: '" ₹" 7.1 | " Rs" 6.4 | " a" 5.2 | " not" 3.0 | " unclear" 1.2 | …' },
        { title: 'Turn scores into probabilities', body: 'Softmax converts scores into probabilities that sum to 100%. Temperature reshapes this distribution: low temperature sharpens it, high temperature flattens it.', active: ['logits', 'probs'], peek: 'next amount: "5,000" 31% | "10,000" 29% | "25,000" 22% | "1,000" 11% | …' },
        { title: 'Pick one', body: 'The model picks the top token (temperature 0) or samples. Notice the distribution above is flat: the model has no idea, but it will still pick a number and continue confidently.', active: ['probs', 'pick'] },
        { title: 'Append and repeat', body: 'The chosen token is appended and the whole process runs again for the next token. Once an invented number is written, the following tokens are generated to be consistent with it — the story builds on its own mistake.', active: ['pick', 'loop'], peek: '"…is ₹10,000 per month of delay, as specified in the 2025 amendment." ← entirely invented' },
        { title: 'Spot the hallucination pattern', body: 'Flat distributions on factual slots (numbers, names, dates, citations) are the danger zone. Grounding with the real document makes the correct token dominate; allowing “not found” gives the model a safe exit.', active: ['hall'], peek: 'with policy text in context: "₹2,500" 94% ✅\nwithout: flat spread across plausible amounts ⚠️' },
      ],
    },
    sandboxTitle: 'Confidence is not correctness',
    sandboxIntro: 'Slide how often a fact appeared in the model’s training data, add or remove grounding, and allow or forbid “I don’t know”. Watch the probability bars and whether the model’s confident answer is actually correct.',
    pmLens: {
      whenToUse: [
        'Any feature that states facts — policies, amounts, dates, legal references — must be grounded in sources.',
        'Creative or drafting tasks tolerate “plausible”; compliance and citizen-facing answers do not.',
        'Design the UX to show sources and let users verify, especially for high-stakes outputs.',
      ],
      costLatency: [
        'Grounding (RAG) adds retrieval latency (~50–300 ms) and input tokens, but is far cheaper than a wrong answer.',
        'Verification steps (a second model checking claims) can double cost — use them on high-risk flows only.',
        'Allowing abstention (“I don’t know”) is free and dramatically reduces hallucination impact.',
      ],
      failureModes: [
        'Invented citations, case numbers, section codes and URLs.',
        'Correct-sounding numbers that are slightly off (₹10,000 vs ₹1,000).',
        'Stakeholders treating fluent tone as evidence of accuracy.',
        'Prompts that pressure the model to always answer (“never say you don’t know”).',
      ],
      questions: [
        'Where in this workflow does the model state facts, and what source grounds each one?',
        'What does the model do when the answer is not in the provided context — and have we tested it?',
        'How do we measure hallucination rate on our golden dataset, release over release?',
      ],
    },
    quiz: [
      { q: 'What is an LLM fundamentally doing when it answers?', options: ['Looking up a database of facts', 'Predicting the most likely next token, repeatedly', 'Searching the internet', 'Running a calculator'], answer: 1, why: 'At its core, an LLM generates text one token at a time by predicting likely continuations.' },
      { q: 'Which situation most raises hallucination risk?', options: ['Common knowledge questions', 'A specific fact absent from training data and not provided in the prompt', 'A question with grounding documents', 'Very short prompts'], answer: 1, why: 'When the fact is missing, the distribution over answers is flat and the model still picks something plausible.' },
      { q: 'Which design change most directly reduces hallucinations in a policy Q&A bot?', options: ['Higher temperature', 'Ground answers in retrieved policy text and allow “not found”', 'A longer system prompt saying “be accurate”', 'Use a bigger font'], answer: 1, why: 'Grounding makes the correct answer dominate; abstention gives a safe exit when it is absent.' },
    ],
    keyTerms: ['Next-token prediction', 'Logits', 'Hallucination', 'Grounding', 'Temperature'],
  },
];
