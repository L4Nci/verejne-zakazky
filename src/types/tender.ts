export type Attachment = { url: string; name: string };

export interface TenderDetail {
  cpv: string[];
  region?: string | null;
  status?: string | null;
  currency?: string | null;
  attachments?: Attachment[];
  description?: string | null;
  budget_value?: number | null;
  procedure_type?: string | null;
  _detail_html_len?: number | null;
}

export interface Tender {
  buyer: string;
  title: string;
  detail: TenderDetail;
  country?: string | null;
  deadline?: string | null;
  notice_url?: string | null;
  external_id: string;
  created_at: string;
}
}

export type TenderFilters = {
  q?: string;
  // other filters are client-side in V1
  status?: string[];
  region?: string[];
  cpv?: string[];
  budgetMin?: number;
  budgetMax?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
};

export type TenderSort = {
  field: "created_at" | "deadline" | "budget_value";
  direction: "asc" | "desc";
};

export type TendersPageResult = {
  data: Tender[];
  count?: number;
  cursor?: string | null;
};
}
}
