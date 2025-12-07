'use client';

import { Provider } from 'react-redux';
import { store } from './store';

/**
 * Redux Provider Bileşeni
 * 
 * Bu bileşen, Redux store'unu tüm uygulamaya sağlar.
 * Next.js App Router'da 'use client' direktifi ile client component olarak işaretlenmelidir.
 * 
 * Kullanım:
 * Layout veya root component'te uygulamayı bu provider ile sarmalayın.
 */

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}

