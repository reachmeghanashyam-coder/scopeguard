export type HunkClassification =
  | 'AUTHORIZED'
  | 'COLLATERAL_MUTATION'
  | 'SCOPE_CREEP'
  | 'INVARIANT_BREACH';

export interface DiffHunk {
  id: string;
  beforeStartLine: number;
  beforeLineCount: number;
  afterStartLine: number;
  afterLineCount: number;
  deletedLines: string[];
  addedLines: string[];
  enclosingSymbol: string;
  status: HunkClassification;
  impactSummary: string;
  accepted: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  tag: string;
  prompt: string;
  filename: string;
  beforeCode: string;
  aiCode: string;
}

export interface AnalysisResult {
  hunks: DiffHunk[];
  concordanceScore: number; // 0 to 100
  authorizedCount: number;
  collateralCount: number;
  linesSaved: number;
}
