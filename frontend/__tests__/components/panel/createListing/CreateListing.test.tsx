import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateListing from '@/body/panel/components/CreateListing';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { createListing, clearError } from '@/body/redux/slices/listing/ListingSlice';

jest.mock('@/body/redux/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}));

jest.mock('@/body/redux/slices/listing/ListingSlice', () => ({
    createListing: jest.fn(),
    selectListingCreating: jest.fn(),
    selectListingError: jest.fn(),
    clearError: jest.fn(),
    uploadMultipleListingImageFiles: jest.fn(),
}));

describe('CreateListing Component', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

        // Default selectors
        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            const ls = require('@/body/redux/slices/listing/ListingSlice');
            if (selector === ls.selectListingCreating) return false;
            if (selector === ls.selectListingError) return null;
            return undefined;
        });

        (createListing as unknown as jest.Mock).mockReturnValue({ unwrap: () => Promise.resolve({ success: true, listingId: 100 }) });
    });

    it('should render basic info step initially', () => {
        render(<CreateListing />);
        expect(screen.getByPlaceholderText('Deniz Manzaralı 3+1...')).toBeInTheDocument();
        expect(screen.getAllByText(/Akıllı Doldurma/i).length).toBeGreaterThan(0);
    });

    it('should update form fields', () => {
        render(<CreateListing />);
        const titleInput = screen.getByPlaceholderText('Deniz Manzaralı 3+1...');
        fireEvent.change(titleInput, { target: { value: 'New Test Listing' } });
        expect(titleInput).toHaveValue('New Test Listing');

        const priceInput = screen.getByPlaceholderText('2.500.000');
        fireEvent.change(priceInput, { target: { value: 1000000 } });
        expect(priceInput).toHaveValue(1000000);
    });

    it('should navigate steps', async () => {
        render(<CreateListing />);

        const nextBtn = screen.getByText(/İlerle/i);

        // Basic -> Details
        fireEvent.click(nextBtn);
        // We know details step has "Dış Özellikler" or similar unique text, 
        // OR we can check if "Temel Bilgiler" is no longer active visual logic, 
        // but simplest is checking for content unique to step 2.
        // Step 2 (Details) has 'Açıklama' text label? Wait, 'Açıklama' is in Step 1 or 2?
        // Let's check code: Basic has description.
        // Details has "Dış Özellikler".

        expect(screen.getByText('Oda Sayısı')).toBeInTheDocument();

        // Details -> Photos
        fireEvent.click(nextBtn);
        expect(screen.getByText('Fotoğraf Yükleyin')).toBeInTheDocument();

        // Photos -> Preview
        fireEvent.click(nextBtn);
        expect(screen.getByText(/İlanınızı yayınlamadan önce/i)).toBeInTheDocument();
    });

    it('should submit form', async () => {
        render(<CreateListing />);

        // Fill Required Fields in Basic Step
        fireEvent.change(screen.getByPlaceholderText('Deniz Manzaralı 3+1...'), { target: { value: 'Test Listing Final' } });
        fireEvent.change(screen.getByPlaceholderText('İlanınız hakkında detaylı bilgi verin...'), { target: { value: 'A very long description for testing purposes that should be longer than 50 chars.' } });

        const nextBtn = screen.getByText(/İlerle/i);

        // Go to Details
        fireEvent.click(nextBtn);
        expect(screen.getByText('Oda Sayısı')).toBeInTheDocument();

        // Go to Photos
        fireEvent.click(nextBtn);
        expect(screen.getByText('Fotoğraf Yükleyin')).toBeInTheDocument();

        // Go to Preview
        fireEvent.click(nextBtn);
        expect(screen.getByText(/İlanınızı yayınlamadan önce/i)).toBeInTheDocument();

        // Now "Yayınla" button should be visible instead of "İlerle"
        // Use getAllByText because "Yayınla" might appear multiple times (e.g. text description + button)
        const submitBtn = screen.getAllByText(/Yayınla/i).find(el => el.tagName === 'BUTTON');
        if (!submitBtn) throw new Error('Submit button not found');

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(createListing).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Test Listing Final',
                description: 'A very long description for testing purposes that should be longer than 50 chars.'
            }));
        });
    });
});
