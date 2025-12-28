import Listings from '@/body/listing/Listings';

/**
 * Ana Sayfa (Landing Page)
 * 
 * Artık ana sayfa olarak doğrudan İlanlar bileşenini (Listings) gösteriyoruz.
 * URL: /
 */

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <Listings />
    </div>
  );
}

