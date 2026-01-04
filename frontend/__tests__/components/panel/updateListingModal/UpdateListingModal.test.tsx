import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpdateListingModal from '@/body/panel/components/UpdateListingModal';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { updateListing, fetchListingById, fetchListingImages } from '@/body/redux/slices/listing/ListingSlice';

jest.mock('@/body/redux/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}));

jest.mock('@/body/redux/slices/listing/ListingSlice', () => ({
    updateListing: jest.fn(),
    fetchListingById: jest.fn(),
    fetchListingImages: jest.fn(),
    fetchMyListings: jest.fn(),
    uploadMultipleListingImageFiles: jest.fn(),
    deleteListingImage: jest.fn(),
    setCoverImage: jest.fn(),
}));

describe('UpdateListingModal Component', () => {
    const mockDispatch = jest.fn();

    const mockProps = {
        listingId: 100,
        onClose: jest.fn(),
        currentPage: 1
    };

    const mockListing = {
        title: 'Original Title',
        price: '1000',
        category: 1,
        type: 1
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Fix: dispatch should return the action passed to it, so that .unwrap() works on the returned object
        // if the action creator returns an object with .unwrap.
        mockDispatch.mockImplementation((action) => action);

        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

        // Mock State
        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            // Mock returned state
            return { currentListingImages: [] };
        });

        // Mock async thunks properly
        const listingResponse = { listing: mockListing };
        (fetchListingById as unknown as jest.Mock).mockReturnValue({
            unwrap: () => Promise.resolve(listingResponse)
        });

        (fetchListingImages as unknown as jest.Mock).mockReturnValue({
            unwrap: () => Promise.resolve([])
        });

        // Mock update
        (updateListing as unknown as jest.Mock).mockReturnValue({ unwrap: () => Promise.resolve({}) });
    });

    it('should render loading initially', () => {
        render(<UpdateListingModal {...mockProps} />);
        expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    });

    it('should render form after loading', async () => {
        render(<UpdateListingModal {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('İlanı Düzenle')).toBeInTheDocument();
            // Title should be populated
            expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
        });
    });

    it('should update listing data locally and submit', async () => {
        render(<UpdateListingModal {...mockProps} />);

        // Wait for load
        await waitFor(() => expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument());

        // Change title
        fireEvent.change(screen.getByDisplayValue('Original Title'), { target: { value: 'Updated Title' } });

        // Save
        const saveBtn = screen.getByText('DEĞİŞİKLİKLERİ KAYDET');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(updateListing).toHaveBeenCalledWith(expect.objectContaining({
                listingId: 100,
                data: expect.objectContaining({ title: 'Updated Title' })
            }));
        });

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should toggle features when clicked', async () => {
        // Features are in separate tab
        render(<UpdateListingModal {...mockProps} />);
        await waitFor(() => expect(screen.getByText('İlanı Düzenle')).toBeInTheDocument());

        const featuresTab = screen.getByText('ÖZELLİKLER');
        fireEvent.click(featuresTab);

        expect(screen.getByText('Krediye Uygun')).toBeInTheDocument();
    });
});
