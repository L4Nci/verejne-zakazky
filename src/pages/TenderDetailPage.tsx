import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, FileText, ArrowLeft, Info, MapPin, Globe, Timer } from "lucide-react";
import { useTenderDetail } from "@/hooks/useTenders";
import { cn, formatCZK } from "@/lib/utils";

export default function TenderDetailPage() {
  const navigate = useNavigate();
  const { external_id } = useParams<{ external_id: string }>();
  const decodedId = external_id ? decodeURIComponent(external_id) : undefined;

  const detail = useTenderDetail(decodedId);

  useEffect(() => {
    // necháme případné "nenalezeno" zobrazit v UI
  }, [detail.isLoading, detail.data]);

  // Pomocné fallbacky – nejdřív zkusíme v detailu, pak top-level
  const d = detail.data;
  const vStatus   = d?.detail?.status ?? d?.status ?? "—";
  const vRegion   = d?.detail?.region ?? d?.region ?? "—";
  const vCountry  = d?.country ?? "—";
  const vBudget   = formatCZK(d?.detail?.budget_value ?? (d as any)?.budget_value ?? null);
  const vCPV      = (d?.detail?.cpv ?? (d as any)?.cpv ?? []).join(", ") || "—";
  const vDeadline = d?.deadline ?? (d as any)?.deadline ?? "—";

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </button>
        <div className="text-sm text-slate-500">
          <Link to="/tenders" className="hover:underline">Seznam zakázek</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700 dark:text-slate-300">Detail</span>
        </div>
      </div>

      {detail.isLoading && <div className="text-slate-500">Načítám detail…</div>}

      {!detail.isLoading && !detail.data && (
        <div className="text-slate-500">Zakázka nebyla nalezena.</div>
      )}

      {!detail.isLoading && d && (
        <article className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
              {d.title}
            </h1>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {d.buyer || "—"}
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Status"   value={vStatus}   icon={<Info className="h-4 w-4" />} />
            <InfoRow label="Region"   value={vRegion}   icon={<MapPin className="h-4 w-4" />} />
            <InfoRow label="Země"     value={vCountry}  icon={<Globe className="h-4 w-4" />} />
            <InfoRow label="Rozpočet" value={vBudget} />
            <InfoRow label="CPV"      value={vCPV} />
            <InfoRow label="Deadline" value={vDeadline} icon={<Timer className="h-4 w-4" />} />
            <InfoRow label="Externí ID" value={d.external_id} />
          </section>

          <section className="prose prose-sm dark:prose-invert max-w-none">
            <h2>Popis</h2>
            <p>{d.detail?.description || (d as any)?.description || "—"}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Přílohy</h2>
            <ul className="space-y-1">
              {(d.detail?.attachments || (d as any)?.attachments || []).length > 0 ? (
                (d.detail?.attachments ?? (d as any)?.attachments ?? []).map((a: any, i: number) => (
                  <li key={i}>
                    <a className="inline-flex items-center text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4 mr-2" /> {a.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Žádné přílohy</li>
              )}
            </ul>
          </section>

          {d.notice_url && (
            <div>
              <a
                href={d.notice_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Otevřít zdroj
              </a>
            </div>
          )}
        </article>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-slate-500">{icon}</span>}
      <div className="min-w-[120px] text-slate-500">{label}:</div>
      <div className={cn("flex-1", !value && "text-slate-400")}>{value || "—"}</div>
    </div>
  );
}
