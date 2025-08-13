export interface Tender {
  hash_id: string;
  source_id: string;
  external_id: string;
  title: string;
  buyer: string | null;
  cpv: string[];
  country: string;
  region: string | null;
  procedure_type: string | null;
  budget_value: number | null;
  currency: string | null;
  deadline: string | null;
  notice_url: string | null;
  attachments: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
  status: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenderFilters {
  search?: string;
  buyer?: string;
  cpv?: string[];
  region?: string;
  status?: string;
  budgetMin?: number;
  budgetMax?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
}

export interface TenderSort {
  field: 'deadline' | 'created_at' | 'budget_value' | 'title';
  direction: 'asc' | 'desc';
}

export interface TendersResponse {
  data: Tender[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}
