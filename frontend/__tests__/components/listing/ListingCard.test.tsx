/**
 * ListingCard Component Tests
 * 
 * İlan kartı bileşeninin render ve interaksiyon testleri.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ListingCard from '@/body/listing/components/ListingCard';
import { ListingListDto, ListingType, Currency } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockListing: ListingListDto = {
  id: 1,
  listingNumber: '123456789',
  title: 'Test İlan Başlığı',
  category: 1,
  type: ListingType.ForSale,
  propertyType: 1,
  price: 1000000,
  currency: Currency.TRY,
  city: 'İstanbul',
  district: 'Kadıköy',
  neighborhood: 'Moda',
  grossSquareMeters: 150,
  netSquareMeters: 120,
  roomCount: '3+1',
  buildingAge: 5,
  floorNumber: 3,
  coverImageUrl: 'https://example.com/image.jpg',
  status: 1,
  ownerType: 1,
  createdAt: new Date().toISOString(),
  viewCount: 100,
  favoriteCount: 25,
  isFeatured: false,
  isUrgent: false,
};

// ============================================================================
// TESTS
// ============================================================================

describe('ListingCard', () => {
  const mockOnFavoriteToggle = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render listing title', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Test İlan Başlığı')).toBeInTheDocument();
    });

    test('should render location information', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText(/Kadıköy, İstanbul/)).toBeInTheDocument();
    });

    test('should render price formatted correctly', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText(/₺1.000.000/)).toBeInTheDocument();
    });

    test('should render view and favorite counts', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument();
    });

    test('should render listing type badge (Satılık)', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Satılık')).toBeInTheDocument();
    });

    test('should render listing type badge (Kiralık)', () => {
      const rentListing = { ...mockListing, type: ListingType.ForRent };
      render(
        <ListingCard
          listing={rentListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Kiralık')).toBeInTheDocument();
    });

    test('should render featured badge when listing is featured', () => {
      const featuredListing = { ...mockListing, isFeatured: true };
      render(
        <ListingCard
          listing={featuredListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('⭐ Öne Çıkan')).toBeInTheDocument();
    });

    test('should render urgent badge when listing is urgent', () => {
      const urgentListing = { ...mockListing, isUrgent: true };
      render(
        <ListingCard
          listing={urgentListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('🔥 Acil')).toBeInTheDocument();
    });

    test('should render placeholder image when coverImageUrl is not provided', () => {
      const listingWithoutImage = { ...mockListing, coverImageUrl: undefined };
      render(
        <ListingCard
          listing={listingWithoutImage}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      const imageContainer = screen.getByText('🏠');
      expect(imageContainer).toBeInTheDocument();
    });

    test('should render room count when available', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText(/3\+1/)).toBeInTheDocument();
    });

    test('should render square meters when available', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText(/m²/i)).toBeInTheDocument();
    });

    test('should render floor number when available', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/Kat/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('should call onViewDetails when card is clicked', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      const image = screen.getByAltText('Test İlan Başlığı');
      fireEvent.click(image);

      expect(mockOnViewDetails).toHaveBeenCalledWith(1);
    });

    test('should call onFavoriteToggle when favorite button is clicked', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /favorilere ekle/i });
      fireEvent.click(favoriteButton);

      expect(mockOnFavoriteToggle).toHaveBeenCalledWith(1);
      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });

    test('should disable favorite button when isToggling is true', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={false}
          isToggling={true}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /favorilere ekle/i });
      expect(favoriteButton).toBeDisabled();
    });

    test('should show filled heart when listing is favorited', () => {
      render(
        <ListingCard
          listing={mockListing}
          isFavorited={true}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Favori butonu içinde ❤️ emoji'si olmalı
      const favoriteButton = screen.getByRole('button', { name: /favorilerden çıkar/i });
      expect(favoriteButton).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    test('should not render favorite button when user is owner', () => {
      const ownerId = "user-123";
      const ownListing = { ...mockListing, ownerId: ownerId };

      render(
        <ListingCard
          listing={ownListing}
          isFavorited={false}
          isToggling={false}
          onFavoriteToggle={mockOnFavoriteToggle}
          onViewDetails={mockOnViewDetails}
          currentUserId={ownerId}
        />
      );

      const favoriteButton = screen.queryByRole('button', { name: /favorilere ekle/i });
      expect(favoriteButton).not.toBeInTheDocument();
    });
  });
});

