/**
 * ConnectionPage — หน้า "สถานะการเชื่อมต่อ": แสดงว่าตัวเชื่อมต่อ (LLM, LINE, ฐานข้อมูลภายนอก ...) ต่อได้ไหม
 * ไว้ดูตอนระบบมีปัญหาว่าติดที่ไหน — อ่านอย่างเดียว ไม่ส่งข้อความหาคนจริง
 */
import { CircleCheck, CircleMinus, CircleX, FlaskConical, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { connectionApi, type ConnectionRow } from '../../api/connectionApi';
import { Button } from '../../components/Button';
import { PageCard, PageTitle } from '../../components/PageCard';
import { Spinner } from '../../components/Spinner';
import { usePopup } from '../../components/Popup';

const MODE_LABEL = { real: 'ของจริง', fake: 'จำลอง', off: 'ปิด' } as const;

function Icon({ row }: { row: ConnectionRow }) {
  if (!row.ok) return <CircleX className="size-5 shrink-0 text-danger" aria-label="ต่อไม่ได้" />;
  if (row.mode === 'off') return <CircleMinus className="size-5 shrink-0 text-muted-foreground" aria-label="ปิดอยู่" />;
  if (row.mode === 'fake') return <FlaskConical className="size-5 shrink-0 text-warn-ink" aria-label="จำลอง" />;
  return <CircleCheck className="size-5 shrink-0 text-success-ink" aria-label="ต่อได้" />;
}

export default function ConnectionPage() {
  const popup = usePopup();
  const [rows, setRows] = useState<ConnectionRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const res = await connectionApi.status().finally(() => setBusy(false));
    if (res.ok && res.data) setRows(res.data);
    else popup.error(res.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageTitle hint="ตรวจว่าตัวเชื่อมต่อของระบบนี้ต่อได้ไหม (อ่านอย่างเดียว ไม่ส่งข้อความหาใคร)">สถานะการเชื่อมต่อ</PageTitle>
      <PageCard
        title="ตัวเชื่อมต่อ"
        actions={
          <Button variant="outline" onClick={() => void load()} loading={busy}>
            <RefreshCw className="size-4" />
            ตรวจอีกครั้ง
          </Button>
        }
      >
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">ระบบนี้ยังไม่มีตัวเชื่อมต่อ (เพิ่มได้ที่ backend/src/integrations/index.ts)</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.name} className="flex items-start gap-3 rounded-md border border-border p-3">
                <Icon row={r} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{r.title}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{MODE_LABEL[r.mode]}</span>
                  </div>
                  <div className="break-words text-sm text-muted-foreground">{r.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
    </>
  );
}
