'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  Heart,
  MessageCircle,
  Send,
  MapPin,
  Calendar,
  Hash,
  Maximize2,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Home,
  Droplets,
  Wind,
  ShieldCheck,
  CreditCard,
  ArrowRightLeft
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  fetchListingById,
  clearCurrentListing,
  clearError,
  selectCurrentListing,
  selectListingDetailLoading,
  selectListingError,
} from '@/body/redux/slices/listing/ListingSlice';
import { selectFavoriteIds, selectFavoriteToggling, toggleFavorite } from '@/body/redux/slices/favorite/FavoriteSlice';
import { selectIsAuthenticated, selectUser } from '@/body/redux/slices/auth/AuthSlice';
import {
  fetchListingComments,
  createComment,
  deleteComment,
  selectCommentsByListing,
  selectCommentLoading,
} from '@/body/redux/slices/comment/CommentSlice';
import { sendMessage } from '@/body/redux/slices/message/MessageSlice';
import { formatPrice } from './components/formatPrice';
import UserAvatar from '../panel/components/UserAvatar';
import { ListingStatus, Currency, HeatingType, BuildingStatus, UsageStatus, FacingDirection, DeedStatus, PropertyType, ListingCategory } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

export default function ListingDetailPage() {
  const params = useParams<{ slug?: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);

  const listingId = useMemo(() => {
    const raw = params?.slug;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params?.slug]);

  const listing = useAppSelector(selectCurrentListing);
  const isLoading = useAppSelector(selectListingDetailLoading);
  const error = useAppSelector(selectListingError);
  const favoriteIds = useAppSelector(selectFavoriteIds);
  const isToggling = useAppSelector(selectFavoriteToggling);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const comments = useAppSelector(selectCommentsByListing(listingId || 0));

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [offerNote, setOfferNote] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isListingOwnerUser = !!listing?.owner.id && currentUser?.id === listing.owner.id;
  const isFavorited = listing ? favoriteIds.includes(listing.id) : false;

  useEffect(() => {
    if (listingId === null) return;
    dispatch(fetchListingById(listingId));
    dispatch(fetchListingComments(listingId));
    return () => {
      dispatch(clearCurrentListing());
      dispatch(clearError());
    };
  }, [dispatch, listingId]);

  const handleFavoriteToggle = async () => {
    if (!listingId) return;
    if (!isAuthenticated) return router.push('/login');
    try {
      await dispatch(toggleFavorite(listingId)).unwrap();
    } catch (err) {
      console.error('Favori hatası:', err);
    }
  };

  const handleSendOffer = () => {
    if (!isAuthenticated || !listingId || offerPrice === '' || Number(offerPrice) <= 0) return;
    dispatch(sendMessage({
      listingId,
      data: { content: offerNote || 'Teklif İsteği', offerPrice: Number(offerPrice), isOffer: true }
    })).unwrap().then(() => {
      setFeedback({ type: 'success', message: 'Teklifiniz başarıyla iletildi.' });
      setShowOfferModal(false);
    }).catch(err => {
      setFeedback({ type: 'error', message: err?.message || 'Teklif gönderilemedi.' });
    });
  };

  const handleSendMessage = () => {
    if (!isAuthenticated || !listingId || !directMessage.trim()) return;
    dispatch(sendMessage({
      listingId,
      data: { content: directMessage.trim(), isOffer: false }
    })).unwrap().then(() => {
      setFeedback({ type: 'success', message: 'Mesajınız başarıyla gönderildi.' });
      setShowMessageModal(false);
      setDirectMessage('');
    }).catch(err => {
      setFeedback({ type: 'error', message: err?.message || 'Mesaj gönderilemedi.' });
    });
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setFeedback({ type: 'success', message: 'İlan bağlantısı kopyalandı!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error || !listing) return <ErrorState error={error} />;

  const images = listing.images.length > 0 ? listing.images : [{ id: 0, imageUrl: '/placeholder.png', isCoverImage: true }];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12 animate-in fade-in duration-500">
      {/* Slim Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 font-bold text-[10px] tracking-widest transition-all group uppercase">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          GERİ DÖN
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {!isListingOwnerUser && (
            <button
              onClick={handleFavoriteToggle}
              disabled={isToggling}
              className={`p-2 rounded-lg transition-all ${isFavorited ? 'bg-red-50 text-red-500' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {feedback && (
          <div className={`mb-4 p-3 rounded-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-xs font-bold">{feedback.message}</p>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[10px] font-black opacity-40 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Compact Gallery */}
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
              <div className="relative group rounded-2xl overflow-hidden aspect-video bg-gray-50">
                <img
                  src={images[activeImageIndex].imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-4 flex justify-between items-end">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {images.length > 1 && images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeImageIndex === idx ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={img.imageUrl} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black text-white border border-white/10 uppercase tracking-widest leading-none">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </div>

                {images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImageIndex(p => p === 0 ? images.length - 1 : p - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setActiveImageIndex(p => p === images.length - 1 ? 0 : p + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </div>

            {/* Title & Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${listing.type === 1 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{listing.type === 1 ? 'SATILIK' : 'KİRALIK'}</span>
                <span className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 text-[9px] font-black tracking-widest uppercase">{getPropertyTypeLabel(listing.propertyType)}</span>
                <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest"><Eye className="w-3 h-3" /> {listing.viewCount} GÖRÜNTÜLENME</span>
              </div>

              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-7 uppercase">{listing.title}</h1>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">KONUM</span><span className="text-xs font-bold text-gray-700 truncate">{listing.district}, {listing.city}</span></div>
                </div>
                <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Hash className="w-4 h-4" /></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">NO</span><span className="text-xs font-bold text-gray-700">#{listing.listingNumber}</span></div>
                </div>
                <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">TARİH</span><span className="text-xs font-bold text-gray-700">{listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('tr-TR') : '-'}</span></div>
                </div>
              </div>
            </div>

            {/* Specs Grid - More compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Oda', value: listing.roomCount || '-', icon: <Home className="w-3.5 h-3.5" /> },
                { label: 'Net m²', value: listing.netSquareMeters, icon: <Maximize2 className="w-3.5 h-3.5" /> },
                { label: 'Brüt m²', value: listing.grossSquareMeters, icon: <Maximize2 className="w-3.5 h-3.5" /> },
                { label: 'Banyo', value: listing.bathroomCount || '-', icon: <Droplets className="w-3.5 h-3.5" /> },
                { label: 'Bina Yaşı', value: listing.buildingAge || '0', icon: <Calendar className="w-3.5 h-3.5" /> },
                { label: 'Kat', value: `${listing.floorNumber}/${listing.totalFloors}`, icon: <Hash className="w-3.5 h-3.5" /> },
                { label: 'Isınma', value: getHeatingTypeLabel(listing.heatingType), icon: <Wind className="w-3.5 h-3.5" /> },
                { label: 'Durum', value: getBuildingStatusLabel(listing.buildingStatus), icon: <ShieldCheck className="w-3.5 h-3.5" /> }
              ].map((spec, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-blue-600 group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-gray-400 group-hover:text-blue-100">{spec.icon}</div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-100 leading-none">{spec.label}</span>
                  </div>
                  <span className="text-xs font-black text-gray-800 group-hover:text-white leading-none">{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Details Sections */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">📝</span>
                Açıklama
              </h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Extra Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
                <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">💰 Finansal Detaylar</h3>
                <div className="space-y-2">
                  {[{ l: 'Kredi', v: listing.isSuitableForCredit }, { l: 'Takas', v: listing.isSuitableForTrade }].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-500">{item.l}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${item.v ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>{item.v ? 'EVET' : 'HAYIR'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
                <h3 className="text-[9px] font-black text-purple-600 uppercase tracking-widest">🏗️ Mülk Bilgileri</h3>
                <div className="space-y-1">
                  {[{ l: 'Tapu', v: getDeedStatusLabel(listing.deedStatus) }, { l: 'Kullanım', v: getUsageStatusLabel(listing.usageStatus) }].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">{item.l}</span>
                      <span className="text-[10px] font-black text-gray-700">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-20 space-y-4">
              {/* Fast Pricing Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-50/50 border border-blue-50">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-1">ŞİMDİ AL</span>
                <div className="text-3xl font-black text-blue-600 tracking-tighter mb-4">
                  {formatPrice(listing.price, listing.type, listing.currency)}
                </div>
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  {listing.monthlyDues && (
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      <span>AİDAT</span>
                      <span className="text-gray-700">{formatPrice(listing.monthlyDues, listing.type, listing.currency)}</span>
                    </div>
                  )}
                  {listing.deposit && (
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      <span>DEPOZİTO</span>
                      <span className="text-gray-700">{formatPrice(listing.deposit, listing.type, listing.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Actions */}
              {!isListingOwnerUser && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => setShowOfferModal(true)} className="flex items-center justify-center gap-2 p-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Send className="w-3.5 h-3.5" /> TEKLİF GÖNDER
                  </button>
                  <button onClick={() => setShowMessageModal(true)} className="flex items-center justify-center gap-2 p-3.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">
                    <MessageCircle className="w-3.5 h-3.5" /> MESAJ GÖNDER
                  </button>
                </div>
              )}

              {/* Compact Owner Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
                <UserAvatar name={listing.owner.name} surname={listing.owner.surname} profilePictureUrl={listing.owner.profilePictureUrl} size="lg" />
                <h3 className="mt-2 text-sm font-black text-gray-800 uppercase tracking-tight leading-none">{listing.owner.name} {listing.owner.surname}</h3>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">İLAN SAHİBİ</span>

                <Link
                  href={`/profile/${listing.owner.id}`}
                  className="text-[8px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest mt-3 border-b border-blue-100 pb-0.5"
                >
                  PROFİLİ GÖR
                </Link>

                <div className="w-full space-y-2 pt-5 mt-5 border-t border-gray-50">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"><Phone className="w-3.5 h-3.5" /></div>
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">TEL</span>
                      <span className="text-[10px] font-bold text-gray-700">{listing.owner.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"><Mail className="w-3.5 h-3.5" /></div>
                    <div className="flex flex-col truncate">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">POSTA</span>
                      <span className="text-[10px] font-bold text-gray-700 truncate max-w-[120px]">{listing.owner.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals using fixed positioning */}
      {showOfferModal && <OfferModal listing={listing} onClose={() => setShowOfferModal(false)} onSend={handleSendOffer} offerPrice={offerPrice} setOfferPrice={setOfferPrice} offerNote={offerNote} setOfferNote={setOfferNote} />}
      {showMessageModal && <MessageModal listing={listing} onClose={() => setShowMessageModal(false)} onSend={handleSendMessage} directMessage={directMessage} setDirectMessage={setDirectMessage} />}
    </div>
  );
}

// Logic components
function LoadingSkeleton() {
  return <div className="max-w-6xl mx-auto p-10 animate-pulse space-y-6"><div className="h-10 bg-gray-100 rounded-2xl w-1/4"></div><div className="grid grid-cols-12 gap-6"><div className="col-span-8 h-[400px] bg-gray-100 rounded-3xl"></div><div className="col-span-4 h-[400px] bg-gray-100 rounded-3xl"></div></div></div>;
}

function ErrorState({ error }: { error: string | null }) {
  return <div className="min-h-screen flex items-center justify-center p-6 text-center space-y-4"><h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{error || 'İlan bulunamadı'}</h2><Link href="/listing" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">İLANLARA DÖN</Link></div>;
}

// Compact Modals
function OfferModal({ listing, onClose, onSend, offerPrice, setOfferPrice, offerNote, setOfferNote }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">TEKLİF VER</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TUTAR</label>
            <div className="relative">
              <input type="number" value={offerPrice || ''} onChange={(e) => setOfferPrice(Number(e.target.value))} className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-black text-gray-700 text-lg" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-black">{getCurrencySymbol(listing.currency)}</span>
            </div>
          </div>
          <textarea value={offerNote} onChange={(e) => setOfferNote(e.target.value)} placeholder="Not ekle..." className="w-full min-h-[100px] p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold text-gray-600 text-xs" />
        </div>
        <button onClick={onSend} className="w-full py-3.5 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-102 transition-all">GÖNDER</button>
      </div>
    </div>
  );
}

function MessageModal({ listing, onClose, onSend, directMessage, setDirectMessage }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">MESAJ GÖNDER</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </div>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <UserAvatar name={listing.owner.name} surname={listing.owner.surname} profilePictureUrl={listing.owner.profilePictureUrl} size="md" />
          <span className="text-xs font-bold text-gray-800">{listing.owner.name} {listing.owner.surname}</span>
        </div>
        <textarea value={directMessage} onChange={(e) => setDirectMessage(e.target.value)} placeholder="Mesajını yaz..." className="w-full min-h-[150px] p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold text-gray-600 text-xs" />
        <button onClick={onSend} className="w-full py-3.5 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-102 transition-all">GÖNDER</button>
      </div>
    </div>
  );
}

const getPropertyTypeLabel = (val?: number) => {
  if (val === undefined || val === null) return 'Emlak';
  const labels: any = {
    [PropertyType.Apartment]: 'Daire',
    [PropertyType.Residence]: 'Rezidans',
    [PropertyType.Villa]: 'Villa',
    [PropertyType.Farmhouse]: 'Çiftlik Evi',
    [PropertyType.Mansion]: 'Köşk',
    [PropertyType.WaterSideHouse]: 'Yalı',
    [PropertyType.SummerHouse]: 'Yazlık'
  };
  return labels[val] || 'Emlak';
};

const getHeatingTypeLabel = (val?: number) => {
  if (val === undefined || val === null) return 'Belirtilmedi';
  const labels: any = {
    [HeatingType.Individual]: 'Kombi',
    [HeatingType.Central]: 'Merkezi',
    [HeatingType.FloorHeating]: 'Yerden Isıtma',
    [HeatingType.AirConditioning]: 'Klima',
    [HeatingType.FuelOil]: 'Fuel-Oil',
    [HeatingType.Coal]: 'Kömür',
    [HeatingType.NaturalGas]: 'Doğalgaz',
    [HeatingType.Electric]: 'Elektrik',
    [HeatingType.Solar]: 'Güneş Enerjisi',
    [HeatingType.Geothermal]: 'Jeotermal',
    [HeatingType.Fireplace]: 'Şömine',
    [HeatingType.None]: 'Isıtma Yok'
  };
  return labels[val] || 'Belirtilmedi';
};

const getBuildingStatusLabel = (val?: number) => {
  if (val === undefined || val === null) return 'Belirtilmedi';
  const labels: any = {
    [BuildingStatus.Zero]: 'Sıfır',
    [BuildingStatus.SecondHand]: '2. El',
    [BuildingStatus.UnderConstruction]: 'İnşaat',
    [BuildingStatus.Renovated]: 'Yenilenmiş'
  };
  return labels[val] || 'Belirtilmedi';
};

const getUsageStatusLabel = (val?: number) => {
  if (val === undefined || val === null) return 'Belirtilmedi';
  const labels: any = {
    [UsageStatus.Empty]: 'Boş',
    [UsageStatus.TenantOccupied]: 'Kiracılı',
    [UsageStatus.OwnerOccupied]: 'Mülk Sahibi'
  };
  return labels[val] || 'Belirtilmedi';
};

const getFacingDirectionLabel = (val?: number) => {
  if (val === undefined || val === null) return '-';
  const labels: any = {
    [FacingDirection.North]: 'Kuzey',
    [FacingDirection.South]: 'Güney',
    [FacingDirection.East]: 'Doğu',
    [FacingDirection.West]: 'Batı',
    [FacingDirection.NorthEast]: 'Kuzeydoğu',
    [FacingDirection.NorthWest]: 'Kuzeybatı',
    [FacingDirection.SouthEast]: 'Güneydoğu',
    [FacingDirection.SouthWest]: 'Güneybatı'
  };
  return labels[val] || '-';
};

const getDeedStatusLabel = (val?: number) => {
  if (val === undefined || val === null) return 'Belirtilmedi';
  const labels: any = {
    [DeedStatus.Title]: 'Kat Mülkiyetli',
    [DeedStatus.SharedTitle]: 'Kat İrtifaklı',
    [DeedStatus.Cooperative]: 'Hisseli',
    [DeedStatus.Construction]: 'İrtifaklı',
    [DeedStatus.RightOfResidence]: 'İskanlı',
    [DeedStatus.Other]: 'Diğer'
  };
  return labels[val] || 'Belirtilmedi';
};

const getCurrencySymbol = (val: number) => {
  if (val === Currency.TRY) return '₺';
  if (val === Currency.USD) return '$';
  if (val === Currency.EUR) return '€';
  return '₺';
};
