import { useEffect, useState } from "react";

type Dispute = {
  id: string;
  status: string;
  resolution: string | null;
  reason: string;
  clientId: string;
  lawyerId: string;
  releaseRequestId: string;
  milestoneId: string;
  updatedAt: string;
};

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/disputes", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        return (await response.json()) as { disputes?: Dispute[] };
      })
      .then((body) => {
        if (!cancelled) setDisputes(body.disputes ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("تعذر تحميل النزاعات حالياً.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">إدارة النزاعات</h1>
        <p className="mt-1 text-sm text-muted-foreground">مراقبة الحالات والانتقالات دون إنشاء مسار مالي موازٍ.</p>
      </header>

      {loading && <p>جاري التحميل...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-right">
                <th className="p-3">النزاع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">القرار</th>
                <th className="p-3">السبب</th>
                <th className="p-3">آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{dispute.id}</td>
                  <td className="p-3">{dispute.status}</td>
                  <td className="p-3">{dispute.resolution ?? "—"}</td>
                  <td className="max-w-md p-3">{dispute.reason}</td>
                  <td className="p-3">{new Date(dispute.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {disputes.length === 0 && (
                <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}>لا توجد نزاعات.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
