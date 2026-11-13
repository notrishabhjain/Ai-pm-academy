export interface RagSection {
  heading: string;
  text: string;
}

export interface RagDoc {
  id: string;
  title: string;
  short: string;
  kind: string;
  sections: RagSection[];
}

export const RAG_DOCS: RagDoc[] = [
  {
    id: 'policy',
    title: 'Citizen Data Handling & Grievance Redressal Policy 2026',
    short: 'Govt Compliance Policy',
    kind: 'Government compliance policy · Department of Public Services',
    sections: [
      {
        heading: '1. Purpose and scope',
        text: 'This policy governs how the Department of Public Services collects, stores and shares citizen personal data. It applies to all officers, contractors and digital platforms operated by the Department. It also sets binding timelines for grievance redressal.',
      },
      {
        heading: '2. Grievance redressal timelines',
        text: 'Every grievance received through the portal, helpline or post must be acknowledged within 3 working days. The acknowledgement must include a unique grievance number. Grievances must be resolved within 30 days of receipt. If a grievance is not resolved within 30 days, it is automatically escalated to the Nodal Grievance Officer. Unresolved grievances after 45 days are escalated to the Appellate Authority, whose decision is final.',
      },
      {
        heading: '3. Data classification',
        text: 'Citizen data is classified as Public, Internal or Restricted. Aadhaar numbers, bank details, health records and grievance attachments are always Restricted. Restricted data must never be pasted into external tools, including public AI chat assistants.',
      },
      {
        heading: '4. Consent and purpose limitation',
        text: 'Personal data may be processed only for the purpose stated at the time of collection. Consent must be free, specific, informed and recorded. Citizens may withdraw consent at any time through the portal, and processing must stop within 7 days of withdrawal.',
      },
      {
        heading: '5. Retention',
        text: 'Grievance records are retained for 3 years after closure. Application documents are retained for 7 years. After the retention period, records must be securely deleted and the deletion must be logged.',
      },
      {
        heading: '6. Personal data breach notification',
        text: 'Any suspected personal data breach must be reported to the Data Protection Officer within 6 hours of discovery. The Data Protection Officer must notify the Data Protection Board within 72 hours, in line with the DPDP Act. Affected citizens must be informed without undue delay, in plain language.',
      },
      {
        heading: '7. Penalties',
        text: 'Officers who violate this policy face disciplinary action. Contractors who mishandle Restricted data face contract termination and a penalty of up to ₹5,00,000 per incident.',
      },
    ],
  },
  {
    id: 'sop',
    title: 'Endpoint Security & Patch Management SOP v4.2',
    short: 'IT Security SOP',
    kind: 'IT security standard operating procedure · State IT Directorate',
    sections: [
      {
        heading: '1. Objective',
        text: 'This SOP defines minimum security controls for all endpoints, including laptops, desktops and servers used by Directorate staff and contractors.',
      },
      {
        heading: '2. Device categories',
        text: 'Endpoints are grouped into three categories based on the data they handle and their exposure. The category determines patch timelines and monitoring requirements.',
      },
      {
        heading: '3. Patch timelines by device category',
        text: 'Patch timelines are measured from the vendor release date. Category A devices are standard office laptops and desktops and must be patched within 7 days of release. Category B devices are endpoints that store or process citizen personal data, including Aadhaar-linked records. For these devices, security patches must be applied within 72 hours, and exceptions require written CISO approval. Category C devices are internet-facing servers, and critical vulnerabilities on them must be fixed within 24 hours.',
      },
      {
        heading: '4. Passwords and authentication',
        text: 'Passwords must be at least 14 characters long and must not reuse any of the last 5 passwords. Privileged accounts must rotate passwords every 90 days. Multi-factor authentication is mandatory for email, VPN and all admin consoles.',
      },
      {
        heading: '5. Lost or stolen endpoints',
        text: 'If an endpoint is lost or stolen, the user must report it to the IT Service Desk within 2 hours by calling extension 4357. The Service Desk will trigger a remote wipe and disable the user’s credentials. A police complaint copy must be submitted within 3 days.',
      },
      {
        heading: '6. Removable media',
        text: 'USB mass storage is blocked on all endpoints by default. Only hardware-encrypted drives issued by the IT Directorate may be used, and only after approval from the reporting officer. Personal removable media must never be connected.',
      },
    ],
  },
  {
    id: 'manual',
    title: 'SolarMax 5kW Hybrid Inverter — User Manual',
    short: 'Product Manual',
    kind: 'Product manual · rooftop solar inverter',
    sections: [
      {
        heading: '1. Specifications',
        text: 'The SolarMax 5kW hybrid inverter supports a maximum PV input of 6.5 kW and works with 48V lithium-ion batteries. Operating temperature range is −10°C to 50°C. The unit must be installed in a shaded, ventilated location away from direct sunlight.',
      },
      {
        heading: '2. LED and error codes',
        text: 'A steady green LED means normal operation. Error E01 indicates grid overvoltage; the inverter reconnects automatically when grid voltage stabilises. Error E04 indicates PV insulation fault; disconnect the panels and call a certified technician. Error E07 indicates battery over-temperature; the inverter reduces charging current and resumes when the battery cools below 45°C.',
      },
      {
        heading: '3. Maintenance',
        text: 'Clean the dust filter every 3 months, or monthly in dusty regions. Check cable connections every 6 months. Never open the inverter cover; there are no user-serviceable parts inside.',
      },
      {
        heading: '4. Warranty',
        text: 'The standard warranty period is 7 years from the date of installation. The warranty can be extended to 10 years if the product is registered online within 90 days of installation. Damage caused by unauthorised repair, flooding or lightning is not covered.',
      },
      {
        heading: '5. Net metering and safety',
        text: 'Net metering requires approval from your electricity distribution company before grid export is enabled. In case of fire, switch off the AC isolator and the battery breaker, then use a CO₂ extinguisher.',
      },
    ],
  },
];

export interface RagQuery {
  id: string;
  q: string;
  docHint: string;
  /** Strings that must appear in a retrieved chunk for the answer to be correct. */
  answerKeys: string[];
  /** Context that must co-occur with the answer key in the SAME chunk to be unambiguous. */
  qualifier?: string;
  correct: string;
  /** What the model says when retrieval surfaces the wrong-but-similar chunk. */
  distractorKey?: string;
  wrong?: string;
  lesson: string;
  outOfScope?: boolean;
}

export const RAG_QUERIES: RagQuery[] = [
  {
    id: 'catb',
    q: 'What is the patch deadline for Category B devices?',
    docHint: 'IT Security SOP',
    answerKeys: ['72 hours'],
    qualifier: 'Category B',
    correct: 'Category B devices (endpoints that store or process citizen personal data) must receive security patches within 72 hours of release; exceptions need written CISO approval.',
    distractorKey: '7 days',
    wrong: 'Category B devices must be patched within 7 days of release.',
    lesson: 'Chunk-boundary trap: with small chunks and no overlap, “Category B” and “72 hours” land in different chunks.',
  },
  {
    id: 'breach',
    q: 'How quickly must a data breach be reported to the Data Protection Officer?',
    docHint: 'Govt Compliance Policy',
    answerKeys: ['6 hours'],
    qualifier: 'Data Protection Officer',
    correct: 'A suspected personal data breach must be reported to the Data Protection Officer within 6 hours of discovery. (The DPO then notifies the Data Protection Board within 72 hours.)',
    distractorKey: '72 hours',
    wrong: 'Breaches must be reported within 72 hours.',
    lesson: 'Two similar deadlines in one section — the model must pick the right one.',
  },
  {
    id: 'lost',
    q: 'I misplaced my work computer — whom should I inform?',
    docHint: 'IT Security SOP',
    answerKeys: ['IT Service Desk'],
    qualifier: '2 hours',
    correct: 'Report the lost endpoint to the IT Service Desk within 2 hours (extension 4357). They will remote-wipe the device and disable your credentials; submit a police complaint copy within 3 days.',
    wrong: 'You should inform your manager and the local police station as soon as possible.',
    lesson: 'Synonym test: “misplaced work computer” vs. “lost endpoint”. Keyword search struggles; vector search shines.',
  },
  {
    id: 'pendrive',
    q: 'Can I use my pen drive to copy files at the office?',
    docHint: 'IT Security SOP',
    answerKeys: ['hardware-encrypted'],
    qualifier: 'USB',
    correct: 'No — USB mass storage is blocked by default and personal removable media must never be connected. Only IT-issued hardware-encrypted drives may be used, after approval from your reporting officer.',
    wrong: 'Yes, pen drives can be used if they are scanned with antivirus first.',
    lesson: 'Synonym test: “pen drive” vs. “USB mass storage / removable media”.',
  },
  {
    id: 'e07',
    q: 'What does error code E07 mean on the inverter?',
    docHint: 'Product Manual',
    answerKeys: ['battery over-temperature'],
    qualifier: 'E07',
    correct: 'E07 means battery over-temperature: the inverter reduces charging current and resumes normal charging when the battery cools below 45°C.',
    distractorKey: 'grid overvoltage',
    wrong: 'E07 indicates grid overvoltage; the inverter reconnects automatically.',
    lesson: 'Exact-code test: keyword search nails “E07”; pure vector search can confuse similar error codes.',
  },
  {
    id: 'resolve',
    q: 'How many days does the department have to resolve a grievance?',
    docHint: 'Govt Compliance Policy',
    answerKeys: ['30 days'],
    qualifier: 'resolved',
    correct: 'Grievances must be resolved within 30 days of receipt; otherwise they escalate automatically to the Nodal Grievance Officer (and to the Appellate Authority after 45 days).',
    distractorKey: '3 working days',
    wrong: 'Grievances must be resolved within 3 working days.',
    lesson: 'Similar numbers nearby (3 days to acknowledge, 30 days to resolve, 45 days to appeal).',
  },
  {
    id: 'warranty',
    q: 'How long is the inverter warranty and can it be extended?',
    docHint: 'Product Manual',
    answerKeys: ['7 years', '10 years'],
    qualifier: 'warranty',
    correct: 'The standard warranty is 7 years from installation, extendable to 10 years if you register online within 90 days of installation.',
    wrong: 'The inverter has a 5-year warranty, extendable by purchasing an AMC.',
    lesson: 'A two-part answer — both parts must be retrieved.',
  },
  {
    id: 'password',
    q: 'What is the minimum password length for staff accounts?',
    docHint: 'IT Security SOP',
    answerKeys: ['14 characters'],
    qualifier: 'Passwords',
    correct: 'Passwords must be at least 14 characters long and must not reuse any of the last 5 passwords.',
    wrong: 'Passwords must be at least 8 characters long with one special character.',
    lesson: 'Straightforward lookup — a good baseline case.',
  },
  {
    id: 'oos',
    q: 'What is the GST rate on rooftop solar panels?',
    docHint: 'Not in any document',
    answerKeys: ['__none__'],
    correct: 'The provided documents do not specify GST rates for solar panels. Please check the official GST rate notification or ask the finance team.',
    wrong: 'Rooftop solar panels attract 5% GST under the concessional renewable energy slab.',
    lesson: 'Out-of-scope test: the right answer is “not found in the documents”.',
    outOfScope: true,
  },
];
