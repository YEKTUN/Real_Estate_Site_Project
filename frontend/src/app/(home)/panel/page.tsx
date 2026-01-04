import Panel from '@/body/panel/Panel';
import { validateAuthServer } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * Panel Sayfası (Server Component)
 * 
 * URL: /panel
 * validateAuthServer sayesinde yetkisiz kullanıcılar sayfayı görmeden login'e yönlendirilir.
 */
export default async function PanelPage() {
  // Sunucu tarafında oturum kontrolü
  await validateAuthServer();

  return <Panel />;
}
