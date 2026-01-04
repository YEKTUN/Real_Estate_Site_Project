import AdminPanel from '@/body/admin/AdminPanel';
import { validateAdminServer } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Merkezi fonksiyondan yetki kontrolü
  await validateAdminServer();

  return <AdminPanel />;
}
