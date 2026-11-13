/** A small, dependency-free JSON Schema validator covering the subset used in this app. */

export type SchemaType = 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'null';

export interface JsonSchema {
  type?: SchemaType | SchemaType[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  enum?: (string | number | null)[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: JsonSchema;
  description?: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  parsed: boolean;
  parseError?: string;
  value?: unknown;
  issues: ValidationIssue[];
  valid: boolean;
}

function typeOf(v: unknown): SchemaType {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v as SchemaType;
}

function matchesType(v: unknown, t: SchemaType): boolean {
  const actual = typeOf(v);
  if (t === 'number') return actual === 'number' || actual === 'integer';
  return actual === t;
}

export function validateValue(value: unknown, schema: JsonSchema, path = '$'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      issues.push({ path, message: `expected ${types.join(' or ')}, got ${typeOf(value)}${typeof value === 'string' ? ` "${value}"` : ''}` });
      return issues;
    }
  }
  if (schema.enum && !schema.enum.includes(value as string | number | null)) {
    issues.push({ path, message: `"${String(value)}" is not one of the allowed values [${schema.enum.map((e) => JSON.stringify(e)).join(', ')}]` });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) issues.push({ path, message: `must be at least ${schema.minLength} characters` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength) issues.push({ path, message: `must be at most ${schema.maxLength} characters` });
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) issues.push({ path, message: `"${value}" does not match the required pattern ${schema.pattern}` });
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push({ path, message: `must be ≥ ${schema.minimum}` });
    if (schema.maximum !== undefined && value > schema.maximum) issues.push({ path, message: `must be ≤ ${schema.maximum}` });
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => issues.push(...validateValue(item, schema.items!, `${path}[${i}]`)));
  }
  if (typeOf(value) === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    for (const req of schema.required ?? []) {
      if (!(req in obj)) issues.push({ path: `${path}.${req}`, message: 'required field is missing' });
    }
    for (const [k, v] of Object.entries(obj)) {
      const sub = schema.properties?.[k];
      if (sub) issues.push(...validateValue(v, sub, `${path}.${k}`));
      else if (schema.additionalProperties === false) issues.push({ path: `${path}.${k}`, message: 'unexpected field not defined in schema' });
    }
  }
  return issues;
}

export function validateJsonText(text: string, schema: JsonSchema): ValidationResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { parsed: false, parseError: msg, issues: [{ path: '$', message: `Not valid JSON — ${msg}` }], valid: false };
  }
  const issues = validateValue(value, schema);
  return { parsed: true, value, issues, valid: issues.length === 0 };
}

/** The grievance-extraction schema shared by the Level 2 sandbox and Lab 2A. */
export const GRIEVANCE_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['applicant_name', 'application_id', 'department', 'issue_category', 'urgency', 'requested_action', 'contact_phone'],
  properties: {
    applicant_name: { type: 'string', minLength: 2 },
    application_id: { type: ['string', 'null'], pattern: '^[A-Z]{3}-\\d{4}-\\d{6}$', description: 'null if not stated' },
    department: { type: 'string', enum: ['Passport Seva', 'Pensions', 'Water Supply', 'Electricity', 'Land Records', 'Municipal Services'] },
    issue_category: { type: 'string', enum: ['delay', 'document_issue', 'payment', 'service_outage', 'staff_conduct', 'other'] },
    urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
    requested_action: { type: 'string', maxLength: 140 },
    contact_phone: { type: ['string', 'null'], pattern: '^\\+91[6-9]\\d{9}$', description: 'null if not stated' },
  },
};
