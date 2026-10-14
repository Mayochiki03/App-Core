import { Link } from 'react-router';
import { PageCard, PageTitle } from '../components/PageCard';
import { menu } from '../config/menu';
import { canAccess } from '../config/routes';
import { useSession } from '../lib/session';

/** หน้าหลัก: ทักทาย + ทางลัดไปทุกหน้าที่ role นี้เข้าได้ (แก้เป็น dashboard ของระบบจริงได้) */
export default function Home() {
  const { user, app } = useSession();
  const shortcuts = menu.flatMap((g) => g.children ?? []).filter((c) => canAccess(c.path, user?.role));

  return (
    <>
      <PageTitle hint={`ยินดีต้อนรับสู่ ${app.name}`}>สวัสดี {user?.full_name}</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.path} to={s.path}>
            <PageCard className="transition-colors hover:bg-primary-soft">
              <span className="font-medium text-primary-ink">{s.label}</span>
            </PageCard>
          </Link>
        ))}
      </div>
    </>
  );
}
