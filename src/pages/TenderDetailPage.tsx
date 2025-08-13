import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, FileText, ArrowLeft, Info, MapPin, Globe, Timer } from "lucide-react";
import { useTenderDetail } from "@/hooks/useTenders";
import { cn, formatCZK } from "@/lib/utils";

export default function TenderDetailPage() {
  const navigate = useNavigate();
  const { external_id } = useParams<{ external_id: string }>();

  // ID z URL může obsahovat lomítka => je potřeba dekódovat
  const decodedId = external_id ? decodeURIComponent(external_id) : undefined;

  const detail = useTenderDetail(decodedId);

  useEffect(() => {
    // případný "nenalezeno" stav řešíme v renderu níže
  }, [detail.isLoading, detail.data]);

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

      {!detail.isLoading && detail.data && (
        <article className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
              {detail.data.title}
            </h1>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {detail.data.buyer || "—"}
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Status" value={detail.data.detail?.status} icon={<Info className="h-4 w-4" />} />
            <InfoRow label="Region" value={detail.data.detail?.region} icon={<MapPin className="h-4 w-4" />} />
            <InfoRow label="Země" value={detail.data.country} icon={<Globe className="h-4 w-4" />} />
            <InfoRow label="Rozpočet" value={formatCZK(detail.data.detail?.budget_value ?? null)} />
            <InfoRow label="CPV" value={(detail.data.detail?.cpv || []).join(", ") || "—"} />
            <InfoRow label="Deadline" value={detail.data.deadline || "—"} icon={<Timer className="h-4 w-4" />} />
            <InfoRow label="Externí ID" value={detail.data.external_id} />
          </section>

          <section className="prose prose-sm dark:prose-invert max-w-none">
            <h2>Popis</h2>
            <p>{detail.data.detail?.description || "—"}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Přílohy</h2>
            <ul className="space-y-1">
              {(detail.data.detail?.attachments || []).length > 0 ? (
                detail.data.detail!.attachments!.map((a, i) => (
                  <li key={i}>
                    <a
                      className="inline-flex items-center text-blue-600 hover:underline"
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-2" /> {a.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Žádné přílohy</li>
              )}
            </ul>
          </section>

          {detail.data.notice_url && (
            <div>
              <a
                href={detail.data.notice_url}
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
