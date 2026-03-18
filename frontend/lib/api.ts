const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api";

export interface PartySummary {
  slug: string;
  name: string;
  short_name: string;
  family: string;
  color: string;
  lrgen: number | null;
  data_completeness: Record<string, boolean>;
}

export interface PositionSnapshot {
  year: number;
  lrgen: number;
  lrecon: number;
  galtan: number;
}

export interface IdeologicalPosition {
  year: number;
  lrgen: number;
  lrecon: number;
  galtan: number;
  eu_position: number;
  immigration: number;
  environment: number;
  redistribution: number;
  antielite: number;
  history: PositionSnapshot[];
}

export interface ElectionResult {
  election_type: string;
  year: number;
  round: number;
  votes: number;
  percentage: number;
  seats: number | null;
  candidate: string | null;
}

export interface PartyFinance {
  year: number;
  total_revenue: number;
  public_funding: number;
  private_donations: number;
  membership_fees: number;
  total_expenses: number;
  assets: number | null;
}

export interface FeasibilityDimension {
  score: number;
  confidence: number;
  justification: string;
  source?: string;
}

export interface Promise {
  id: string;
  party_slug: string;
  candidate: string;
  raw_text: string;
  theme: string;
  action_verb: string;
  action_object: string;
  quantification: Record<string, unknown> | null;
  cost_announced: Record<string, unknown> | null;
  funding_source: string | null;
  timeline: string | null;
  target_population: string | null;
  classification: string;
  precision_level: string;
  feasibility: {
    overall: number;
    label: string;
    uncertainty?: number;
    ci_95?: [number, number];
    dimensions?: Record<string, FeasibilityDimension>;
    monte_carlo?: {
      mean: number;
      std: number;
      p5: number;
      p95: number;
    };
  } | null;
  source_url: string | null;
  source_type: string | null;
  source_orientation: string | null;
  funding_status: string | null;
  candidate_justification: string | null;
  sources_croisees: {
    url: string;
    type: string;
    orientation: string;
  }[] | null;
  factcheck_verdict: string | null;
}

export interface ParliamentaryActivity {
  legislature: number;
  group_name: string;
  group_size: number;
  total_interventions: number;
  total_amendments: number;
  amendments_adopted_pct: number;
  avg_presence_pct: number;
  total_questions: number;
  top_themes: string[];
  key_votes: Record<string, unknown>[];
}

export interface PartyIdentity {
  slug: string;
  name: string;
  short_name: string;
  leader: string;
  founded: number;
  family: string;
  nuance_mi: string;
  color: string;
  ids: Record<string, string>;
}

export interface PartyProfile {
  identity: PartyIdentity;
  positioning: IdeologicalPosition | null;
  elections: ElectionResult[];
  finance: PartyFinance | null;
  promises: Promise[];
  parliamentary: ParliamentaryActivity | null;
}

export interface ComparisonResult {
  parties: string[];
  positioning_radar: Record<string, Record<string, number>>;
  finance_comparison: Record<string, Record<string, number>>;
  promise_themes: Record<string, { count: number; themes: Record<string, number>; total_cost_eur: number; avg_feasibility: number | null }>;
  parliamentary_activity: Record<string, Record<string, number>>;
}

async function fetchJSON<T>(path: string): globalThis.Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getParties: () => fetchJSON<PartySummary[]>("/parties"),
  getParty: (slug: string) => fetchJSON<PartyProfile>(`/parties/${slug}`),
  compare: (slugs: string[]) => fetchJSON<ComparisonResult>(`/compare?parties=${slugs.join(",")}`),
};
