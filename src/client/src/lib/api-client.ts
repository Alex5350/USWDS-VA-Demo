import { getSelectedDemoUser } from "@/lib/demo-auth";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type DashboardSummary = {
  totalClaimsReviewed: number;
  highRiskClaims: number;
  criticalRiskClaims: number;
  estimatedQuestionedCost: number;
  duplicatePaymentCandidates: number;
  providersWithAbnormalPatterns: number;
  openCases: number;
  averageCaseAgeDays: number;
};

export type RiskQueueItem = {
  caseId: number;
  claimId: number;
  providerName: string;
  providerType: string;
  procedureCode: string;
  serviceDate: string;
  paidAmount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFlags: string[];
  estimatedQuestionedCost: number;
  status: string;
};

export type RiskQueueFilters = {
  riskLevel?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  providerType?: string;
  search?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CaseDetail = {
  caseId: number;
  claimId: number;
  status: string;
  priority: string;
  assignedTo: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  estimatedQuestionedCost: number;
  createdDate: string;
  closedDate?: string | null;
  claim: {
    claimId?: number;
    procedureCode: string;
    serviceDate: string;
    submittedDate: string;
    paidDate: string | null;
    claimAmount: number;
    paidAmount: number;
    claimStatus: string;
  };
  provider: {
    providerName: string;
    npi: string;
    providerType: string;
    state: string;
    riskTier: string;
  };
  authorization: {
    authorizationId: number | null;
    procedureCode: string;
    startDate: string;
    endDate: string;
    authorizedAmount: number;
    status: string;
  } | null;
  riskFindings: {
    riskFindingId: number;
    riskRuleId?: number;
    ruleCode: string;
    ruleName: string;
    scoreContribution: number;
    explanation: string;
  }[];
  complaints: {
    complaintId: number;
    receivedDate: string;
    complaintType: string;
    narrativeSummary: string;
    status: string;
  }[];
  notes: {
    noteId: number;
    createdBy: string;
    createdDate: string;
    noteText: string;
  }[];
};

export type DeletedCaseRecord = {
  caseId: number;
  claimId: number;
  providerName: string;
  status: string;
  riskLevel: RiskLevel;
  riskScore: number;
  estimatedQuestionedCost: number;
  createdDate: string;
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
};

export type UpdateCaseRecordRequest = {
  assignedTo: string | null;
  priority: string;
  estimatedQuestionedCost: number;
  procedureCode: string;
  serviceDate: string;
  submittedDate: string;
  paidDate: string | null;
  claimAmount: number;
  paidAmount: number;
  claimStatus: string;
};

export type RiskRule = {
  riskRuleId: number;
  ruleCode: string;
  ruleName: string;
  description: string;
  weight: number;
  isEnabled: boolean;
};

export type ProviderRiskSummary = {
  providerName: string;
  providerType: string;
  state: string;
  claimCount: number;
  totalPaidAmount: number;
  highRiskClaimCount: number;
  criticalRiskClaimCount: number;
  estimatedQuestionedCost: number;
  averageRiskScore: number;
};

export type QuestionedCostTrend = {
  month: string;
  totalPaidAmount: number;
  estimatedQuestionedCost: number;
  highRiskClaimCount: number;
  caseCount: number;
};

export type CaseAging = {
  status: string;
  days0To15: number;
  days16To30: number;
  days31To60: number;
  days61Plus: number;
};

export type PowerBiEmbedConfig = {
  enabled: boolean;
  mode: string;
  message: string;
};

export type CreateCaseRecordRequest = {
  providerId: number;
  stateCode: string;
  procedureCodeId: number;
  serviceDate: string;
  paidAmount: number;
  riskRuleIds: number[];
  narrativeSummary?: string;
  assignedTo?: string;
};

export type CreateCaseRecordResponse = {
  caseId: number;
  claimId: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: string;
};

export type DemoUserPermissionSummary = {
  email: string;
  displayName: string;
  roles: string[];
  basePermissions: string[];
  effectivePermissions: string[];
};

export type AuditEvent = {
  auditEventId: number;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
};

export type StateTerritory = {
  code: string;
  name: string;
  type: string;
};

export type Provider = {
  providerId: number;
  providerName: string;
  npi: string;
  providerType: string;
  state: string;
  riskTier: string;
  isEnabled: boolean;
};

export type UpsertProviderRequest = {
  providerName: string;
  npi: string;
  providerType: string;
  state: string;
  riskTier: string;
  isEnabled: boolean;
};

export type ProcedureCode = {
  procedureCodeId: number;
  code: string;
  description: string;
  category: string;
  defaultAmount: number | null;
  isEnabled: boolean;
};

export type UpsertProcedureCodeRequest = {
  code: string;
  description: string;
  category: string;
  defaultAmount: number | null;
  isEnabled: boolean;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

const mockDashboardSummary: DashboardSummary = {
  totalClaimsReviewed: 42318,
  highRiskClaims: 1284,
  criticalRiskClaims: 241,
  estimatedQuestionedCost: 8700000,
  duplicatePaymentCandidates: 217,
  providersWithAbnormalPatterns: 43,
  openCases: 96,
  averageCaseAgeDays: 18.4
};

const mockStates: StateTerritory[] = [
  { code: "VA", name: "Virginia", type: "State" },
  { code: "MD", name: "Maryland", type: "State" },
  { code: "NC", name: "North Carolina", type: "State" },
  { code: "PA", name: "Pennsylvania", type: "State" },
  { code: "OH", name: "Ohio", type: "State" },
  { code: "PR", name: "Puerto Rico", type: "Territory" }
];

const mockProviders: Provider[] = [
  {
    providerId: 1,
    providerName: "Demo Community Dental Group",
    npi: "9000000001",
    providerType: "Dental",
    state: "VA",
    riskTier: "Elevated",
    isEnabled: true
  },
  {
    providerId: 2,
    providerName: "Sample Regional Imaging LLC",
    npi: "9000000002",
    providerType: "Imaging",
    state: "MD",
    riskTier: "Elevated",
    isEnabled: true
  },
  {
    providerId: 3,
    providerName: "Training Physical Therapy Partners",
    npi: "9000000003",
    providerType: "Physical Therapy",
    state: "NC",
    riskTier: "Medium",
    isEnabled: true
  }
];

const mockProcedureCodes: ProcedureCode[] = [
  {
    procedureCodeId: 1,
    code: "D2740",
    description: "Crown - porcelain or ceramic substrate",
    category: "Dental",
    defaultAmount: 1850,
    isEnabled: true
  },
  {
    procedureCodeId: 2,
    code: "97110",
    description: "Therapeutic exercise service, each 15 minutes",
    category: "Physical Therapy",
    defaultAmount: 325,
    isEnabled: true
  },
  {
    procedureCodeId: 3,
    code: "73721",
    description: "MRI lower extremity joint without contrast material",
    category: "Imaging",
    defaultAmount: 1400,
    isEnabled: true
  }
];

const mockRiskQueue: RiskQueueItem[] = [
  {
    caseId: 1001,
    claimId: 50221,
    providerName: "Demo Community Dental Group",
    providerType: "Dental",
    procedureCode: "D2740",
    serviceDate: "2026-03-15",
    paidAmount: 1850,
    riskScore: 85,
    riskLevel: "Critical",
    riskFlags: ["Missing Authorization", "High-Dollar Outlier", "Hotline Match"],
    estimatedQuestionedCost: 1850,
    status: "New"
  },
  {
    caseId: 1002,
    claimId: 50238,
    providerName: "Sample Regional Imaging LLC",
    providerType: "Imaging",
    procedureCode: "MRI-72148",
    serviceDate: "2026-04-02",
    paidAmount: 2400,
    riskScore: 80,
    riskLevel: "Critical",
    riskFlags: ["Duplicate Claim", "Provider Repeat Pattern", "Rapid Resubmission"],
    estimatedQuestionedCost: 2400,
    status: "UnderReview"
  },
  {
    caseId: 1003,
    claimId: 50311,
    providerName: "Training Physical Therapy Partners",
    providerType: "Physical Therapy",
    procedureCode: "97110",
    serviceDate: "2026-02-18",
    paidAmount: 620,
    riskScore: 75,
    riskLevel: "High",
    riskFlags: ["Expired Authorization", "Provider Repeat Pattern", "Prior Case History"],
    estimatedQuestionedCost: 620,
    status: "New"
  },
  {
    caseId: 1004,
    claimId: 50376,
    providerName: "Example Home Health Services",
    providerType: "Home Health",
    procedureCode: "G0156",
    serviceDate: "2026-01-29",
    paidAmount: 1320,
    riskScore: 70,
    riskLevel: "High",
    riskFlags: ["Service After Death Date", "Missing Authorization"],
    estimatedQuestionedCost: 1320,
    status: "UnderReview"
  },
  {
    caseId: 1005,
    claimId: 50402,
    providerName: "Synthetic Mobility Supply Co",
    providerType: "Durable Medical Equipment",
    procedureCode: "E0973",
    serviceDate: "2026-05-04",
    paidAmount: 980,
    riskScore: 62,
    riskLevel: "High",
    riskFlags: ["High-Dollar Outlier", "Rapid Resubmission"],
    estimatedQuestionedCost: 980,
    status: "New"
  },
  {
    caseId: 1006,
    claimId: 50477,
    providerName: "Demo Community Dental Group",
    providerType: "Dental",
    procedureCode: "D2950",
    serviceDate: "2026-05-11",
    paidAmount: 740,
    riskScore: 55,
    riskLevel: "Medium",
    riskFlags: ["Provider Repeat Pattern", "Prior Case History"],
    estimatedQuestionedCost: 370,
    status: "New"
  }
];

const mockRules: RiskRule[] = [
  {
    riskRuleId: 1,
    ruleCode: "DUPLICATE_CLAIM",
    ruleName: "Duplicate claim candidate",
    description: "Same provider, veteran, procedure, and service date appear more than once.",
    weight: 25,
    isEnabled: true
  },
  {
    riskRuleId: 2,
    ruleCode: "MISSING_AUTHORIZATION",
    ruleName: "Missing authorization",
    description: "Claim does not reference a matching authorization record.",
    weight: 25,
    isEnabled: true
  },
  {
    riskRuleId: 3,
    ruleCode: "EXPIRED_AUTHORIZATION",
    ruleName: "Expired authorization",
    description: "Service date falls outside the authorization date range.",
    weight: 20,
    isEnabled: true
  },
  {
    riskRuleId: 4,
    ruleCode: "HIGH_DOLLAR_OUTLIER",
    ruleName: "High-dollar outlier",
    description: "Paid amount is materially above the demo benchmark for procedure and provider type.",
    weight: 15,
    isEnabled: true
  },
  {
    riskRuleId: 5,
    ruleCode: "HOTLINE_MATCH",
    ruleName: "Hotline complaint match",
    description: "Provider or synthetic veteran identifier is referenced in an open complaint.",
    weight: 20,
    isEnabled: true
  },
  {
    riskRuleId: 6,
    ruleCode: "SERVICE_AFTER_DEATH_DATE",
    ruleName: "Service after death date",
    description: "Service date is after the synthetic profile death date.",
    weight: 35,
    isEnabled: true
  },
  {
    riskRuleId: 7,
    ruleCode: "PROVIDER_REPEAT_PATTERN",
    ruleName: "Provider repeat pattern",
    description: "Provider has repeated high-risk billing patterns in the demo period.",
    weight: 15,
    isEnabled: true
  },
  {
    riskRuleId: 8,
    ruleCode: "PRIOR_CASE_HISTORY",
    ruleName: "Prior case history",
    description: "Provider has prior review candidates in the synthetic case file history.",
    weight: 10,
    isEnabled: true
  },
  {
    riskRuleId: 9,
    ruleCode: "RAPID_RESUBMISSION",
    ruleName: "Rapid resubmission",
    description: "A denied or adjusted claim appears to have been resubmitted quickly.",
    weight: 10,
    isEnabled: true
  }
];

const mockProviderRisk: ProviderRiskSummary[] = [
  {
    providerName: "Demo Community Dental Group",
    providerType: "Dental",
    state: "TX",
    claimCount: 142,
    totalPaidAmount: 286400,
    highRiskClaimCount: 24,
    criticalRiskClaimCount: 8,
    estimatedQuestionedCost: 68700,
    averageRiskScore: 64
  },
  {
    providerName: "Sample Regional Imaging LLC",
    providerType: "Imaging",
    state: "CA",
    claimCount: 98,
    totalPaidAmount: 421900,
    highRiskClaimCount: 18,
    criticalRiskClaimCount: 6,
    estimatedQuestionedCost: 92400,
    averageRiskScore: 61
  },
  {
    providerName: "Training Physical Therapy Partners",
    providerType: "Physical Therapy",
    state: "FL",
    claimCount: 211,
    totalPaidAmount: 194250,
    highRiskClaimCount: 31,
    criticalRiskClaimCount: 4,
    estimatedQuestionedCost: 38250,
    averageRiskScore: 56
  },
  {
    providerName: "Example Home Health Services",
    providerType: "Home Health",
    state: "OH",
    claimCount: 76,
    totalPaidAmount: 318700,
    highRiskClaimCount: 16,
    criticalRiskClaimCount: 5,
    estimatedQuestionedCost: 80400,
    averageRiskScore: 59
  }
];

const mockQuestionedCostTrend: QuestionedCostTrend[] = [
  { month: "2026-01", totalPaidAmount: 1280000, estimatedQuestionedCost: 420000, highRiskClaimCount: 176, caseCount: 18 },
  { month: "2026-02", totalPaidAmount: 1325000, estimatedQuestionedCost: 510000, highRiskClaimCount: 194, caseCount: 22 },
  { month: "2026-03", totalPaidAmount: 1460000, estimatedQuestionedCost: 590000, highRiskClaimCount: 218, caseCount: 26 },
  { month: "2026-04", totalPaidAmount: 1535000, estimatedQuestionedCost: 640000, highRiskClaimCount: 232, caseCount: 29 },
  { month: "2026-05", totalPaidAmount: 1610000, estimatedQuestionedCost: 710000, highRiskClaimCount: 247, caseCount: 31 }
];

const mockCaseAging: CaseAging[] = [
  { status: "New", days0To15: 28, days16To30: 9, days31To60: 4, days61Plus: 1 },
  { status: "UnderReview", days0To15: 18, days16To30: 15, days31To60: 7, days61Plus: 2 },
  { status: "Referred", days0To15: 4, days16To30: 5, days31To60: 2, days61Plus: 1 },
  { status: "Closed", days0To15: 0, days16To30: 2, days31To60: 3, days61Plus: 6 }
];

const mockCaseDetails: CaseDetail[] = mockRiskQueue.map((item, index) => ({
  caseId: item.caseId,
  claimId: item.claimId,
  status: item.status,
  priority: item.riskLevel === "Critical" ? "Priority 1" : "Priority 2",
  assignedTo: index % 2 === 0 ? "Demo Analyst" : "Demo Investigator",
  riskScore: item.riskScore,
  riskLevel: item.riskLevel,
  estimatedQuestionedCost: item.estimatedQuestionedCost,
  createdDate: "2026-05-15",
  claim: {
    procedureCode: item.procedureCode,
    serviceDate: item.serviceDate,
    submittedDate: "2026-05-17",
    paidDate: "2026-05-24",
    claimAmount: item.paidAmount,
    paidAmount: item.paidAmount,
    claimStatus: "Paid"
  },
  provider: {
    providerName: item.providerName,
    npi: `19900010${index}`,
    providerType: item.providerType,
    state: ["TX", "CA", "FL", "OH", "AZ", "TX"][index] ?? "TX",
    riskTier: item.riskLevel === "Critical" ? "Elevated" : "Monitored"
  },
  authorization:
    item.riskFlags.includes("Missing Authorization")
      ? null
      : {
          authorizationId: 7000 + index,
          procedureCode: item.procedureCode,
          startDate: "2026-01-01",
          endDate: item.riskFlags.includes("Expired Authorization") ? "2026-02-01" : "2026-12-31",
          authorizedAmount: item.paidAmount,
          status: item.riskFlags.includes("Expired Authorization") ? "Expired" : "Approved"
        },
  riskFindings: item.riskFlags.map((flag, flagIndex) => ({
    riskFindingId: item.caseId * 10 + flagIndex,
    ruleCode: flag.toUpperCase().replaceAll(" ", "_").replaceAll("-", "_"),
    ruleName: flag,
    scoreContribution: [25, 20, 15, 10][flagIndex] ?? 10,
    explanation: `${flag} was triggered by deterministic demo business rules for claim ${item.claimId}.`
  })),
  complaints: item.riskFlags.includes("Hotline Match")
    ? [
        {
          complaintId: 8101,
          receivedDate: "2026-03-10",
          complaintType: "Billing pattern concern",
          narrativeSummary: "Synthetic hotline complaint references repeated billing by this demo provider.",
          status: "Open"
        }
      ]
    : [],
  notes: [
    {
      noteId: item.caseId * 100,
      createdBy: "Demo Analyst",
      createdDate: "2026-05-18",
      noteText: "Initial triage review created from explainable risk findings."
    }
  ]
}));

function createHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Demo-User": getSelectedDemoUser().email
  };
}

async function requestJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...createHeaders(),
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function filterRiskQueue(filters: RiskQueueFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const normalizedSearch = filters.search?.trim().toLowerCase();

  const filtered = mockRiskQueue.filter((item) => {
    const matchesRisk = !filters.riskLevel || filters.riskLevel === "All" || item.riskLevel === filters.riskLevel;
    const matchesStatus = !filters.status || filters.status === "All" || item.status === filters.status;
    const matchesProviderType =
      !filters.providerType || filters.providerType === "All" || item.providerType === filters.providerType;
    const matchesSearch = !normalizedSearch || item.providerName.toLowerCase().includes(normalizedSearch);
    const matchesFromDate = !filters.fromDate || item.serviceDate >= filters.fromDate;
    const matchesToDate = !filters.toDate || item.serviceDate <= filters.toDate;

    return matchesRisk && matchesStatus && matchesProviderType && matchesSearch && matchesFromDate && matchesToDate;
  });

  const sorted = filtered.toSorted((a, b) =>
    filters.sortDirection === "riskScoreAsc" ? a.riskScore - b.riskScore : b.riskScore - a.riskScore
  );
  const startIndex = (page - 1) * pageSize;
  const items = sorted.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalItems: sorted.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize))
  };
}

function toQuery(filters: RiskQueueFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "All") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function getDashboardSummary() {
  return requestJson<DashboardSummary>("/api/dashboard/summary", mockDashboardSummary);
}

export async function getRiskQueue(filters: RiskQueueFilters = {}) {
  const query = toQuery(filters);
  return requestJson<PaginatedResponse<RiskQueueItem>>(
    `/api/risk-queue${query ? `?${query}` : ""}`,
    filterRiskQueue(filters)
  );
}

export async function getStates() {
  return requestJson<StateTerritory[]>("/api/reference/states", mockStates);
}

export async function getProviders(activeOnly = true, search = "") {
  const params = new URLSearchParams({
    activeOnly: String(activeOnly)
  });
  if (search.trim()) {
    params.set("search", search.trim());
  }

  return requestJson<Provider[]>(`/api/providers?${params.toString()}`, mockProviders);
}

export async function addProvider(request: UpsertProviderRequest) {
  return requestJson<Provider>(
    "/api/providers",
    {
      providerId: Date.now(),
      ...request
    },
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

export async function updateProvider(providerId: number, request: UpsertProviderRequest) {
  return requestJson<Provider>(
    `/api/providers/${providerId}`,
    {
      providerId,
      ...request
    },
    {
      method: "PUT",
      body: JSON.stringify(request)
    }
  );
}

export async function getProcedureCodes(activeOnly = true, search = "") {
  const params = new URLSearchParams({
    activeOnly: String(activeOnly)
  });
  if (search.trim()) {
    params.set("search", search.trim());
  }

  return requestJson<ProcedureCode[]>(`/api/procedure-codes?${params.toString()}`, mockProcedureCodes);
}

export async function addProcedureCode(request: UpsertProcedureCodeRequest) {
  return requestJson<ProcedureCode>(
    "/api/procedure-codes",
    {
      procedureCodeId: Date.now(),
      ...request
    },
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

export async function updateProcedureCode(procedureCodeId: number, request: UpsertProcedureCodeRequest) {
  return requestJson<ProcedureCode>(
    `/api/procedure-codes/${procedureCodeId}`,
    {
      procedureCodeId,
      ...request
    },
    {
      method: "PUT",
      body: JSON.stringify(request)
    }
  );
}

export async function getCaseDetail(caseId: number) {
  const fallback = mockCaseDetails.find((item) => item.caseId === caseId) ?? mockCaseDetails[0];
  return requestJson<CaseDetail>(`/api/cases/${caseId}`, fallback);
}

export async function addCaseNote(caseId: number, noteText: string, createdBy: string) {
  return requestJson<{ ok: boolean }>(
    `/api/cases/${caseId}/notes`,
    { ok: true },
    {
      method: "POST",
      body: JSON.stringify({ noteText, createdBy })
    }
  );
}

export async function updateCaseStatus(caseId: number, status: string) {
  return requestJson<{ ok: boolean }>(
    `/api/cases/${caseId}/status`,
    { ok: true },
    {
      method: "PUT",
      body: JSON.stringify({ status })
    }
  );
}

export async function updateCaseRecord(caseId: number, request: UpdateCaseRecordRequest) {
  const fallback = mockCaseDetails.find((item) => item.caseId === caseId) ?? mockCaseDetails[0];
  return requestJson<CaseDetail>(
    `/api/cases/${caseId}`,
    {
      ...fallback,
      assignedTo: request.assignedTo,
      priority: request.priority,
      estimatedQuestionedCost: request.estimatedQuestionedCost,
      claim: {
        ...fallback.claim,
        procedureCode: request.procedureCode,
        serviceDate: request.serviceDate,
        submittedDate: request.submittedDate,
        paidDate: request.paidDate,
        claimAmount: request.claimAmount,
        paidAmount: request.paidAmount,
        claimStatus: request.claimStatus
      }
    },
    {
      method: "PUT",
      body: JSON.stringify(request)
    }
  );
}

export async function getDeletedCaseRecords() {
  return requestJson<DeletedCaseRecord[]>("/api/cases/deleted", []);
}

export async function deleteCaseRecord(caseId: number, reason = "") {
  return requestJson<{ ok: boolean }>(
    `/api/cases/${caseId}/delete`,
    { ok: true },
    {
      method: "POST",
      body: JSON.stringify({ reason })
    }
  );
}

export async function restoreCaseRecord(caseId: number) {
  return requestJson<{ ok: boolean }>(
    `/api/cases/${caseId}/restore`,
    { ok: true },
    {
      method: "PUT"
    }
  );
}

export async function escalateCase(caseId: number, justification: string) {
  return requestJson<{ ok: boolean }>(
    `/api/cases/${caseId}/escalate`,
    { ok: true },
    {
      method: "PUT",
      body: JSON.stringify({ justification })
    }
  );
}

export async function deEscalateCase(caseId: number, justification: string) {
  return requestJson<{ ok: boolean }>(
    `/api/cases/${caseId}/de-escalate`,
    { ok: true },
    {
      method: "PUT",
      body: JSON.stringify({ justification })
    }
  );
}

export async function createCaseRecord(request: CreateCaseRecordRequest) {
  return requestJson<CreateCaseRecordResponse>(
    "/api/cases",
    {
      caseId: Date.now(),
      claimId: Date.now(),
      riskScore: 0,
      riskLevel: "Low",
      status: "New"
    },
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

export async function getRiskRules() {
  return requestJson<RiskRule[]>("/api/rules", mockRules);
}

export async function updateRiskRule(rule: RiskRule) {
  return requestJson<RiskRule>(
    `/api/rules/${rule.riskRuleId}`,
    rule,
    {
      method: "PUT",
      body: JSON.stringify(rule)
    }
  );
}

export async function getDemoPermissionUsers() {
  return requestJson<DemoUserPermissionSummary[]>("/api/security/users", []);
}

export async function updateDemoUserPermissions(email: string, permissions: string[]) {
  return requestJson<DemoUserPermissionSummary>(
    `/api/security/users/${encodeURIComponent(email)}/permissions`,
    {
      email,
      displayName: email,
      roles: [],
      basePermissions: [],
      effectivePermissions: permissions
    },
    {
      method: "PUT",
      body: JSON.stringify({ permissions })
    }
  );
}

export async function getAuditEvents() {
  return requestJson<AuditEvent[]>("/api/security/audit?limit=75", []);
}

export async function getProviderRiskReport() {
  return requestJson<ProviderRiskSummary[]>("/api/reports/provider-risk", mockProviderRisk);
}

export async function getQuestionedCostTrend() {
  return requestJson<QuestionedCostTrend[]>("/api/reports/questioned-cost-trend", mockQuestionedCostTrend);
}

export async function getCaseAgingReport() {
  return requestJson<CaseAging[]>("/api/reports/case-aging", mockCaseAging);
}

export async function getPowerBiEmbedConfig() {
  return requestJson<PowerBiEmbedConfig>("/api/powerbi/embed-config", {
    enabled: false,
    mode: "demo-placeholder",
    message: "Power BI embedding is not configured. Displaying SQL-backed reporting dashboard instead."
  });
}

export async function getRiskQueueCsv() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/reports/export/risk-queue.csv`, {
      cache: "no-store",
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`CSV request failed with ${response.status}`);
    }

    return await response.blob();
  } catch {
    const rows = [
      ["Case ID", "Claim ID", "Provider", "Risk Level", "Risk Score", "Estimated Questioned Cost"],
      ...mockRiskQueue.map((item) => [
        item.caseId,
        item.claimId,
        item.providerName,
        item.riskLevel,
        item.riskScore,
        item.estimatedQuestionedCost
      ])
    ];
    return new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  }
}

export async function getProviderRiskCsv() {
  const rows = [
    [
      "Provider",
      "Type",
      "State",
      "Claims",
      "Total Paid",
      "High Risk Claims",
      "Critical Risk Claims",
      "Estimated Questioned Cost",
      "Average Risk Score"
    ],
    ...mockProviderRisk.map((item) => [
      item.providerName,
      item.providerType,
      item.state,
      item.claimCount,
      item.totalPaidAmount,
      item.highRiskClaimCount,
      item.criticalRiskClaimCount,
      item.estimatedQuestionedCost,
      item.averageRiskScore
    ])
  ];
  return new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
}
