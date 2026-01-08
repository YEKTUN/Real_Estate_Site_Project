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
  Copy,
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
import { formatPhone } from '@/body/auth/utils/validation';
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [messageType, setMessageType] = useState<'offer' | 'message'>('message');
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [messageContent, setMessageContent] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isListingOwnerUser = useMemo(() => {
    if (!listing?.owner.id || !currentUser?.id) return false;
    return String(listing.owner.id) === String(currentUser.id);
  }, [listing?.owner.id, currentUser?.id]);

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

  // Debug: Gizlilik ayarlarını kontrol et
  useEffect(() => {
    if (listing) {
      console.log('🔍 İlan Detay - Gizlilik Verisi:', {
        ownerEmail: listing.owner.email,
        ownerPhone: listing.owner.phone,
        showEmailSetting: listing.owner.showEmail,
        showPhoneSetting: listing.owner.showPhone,
        isOwnerView: isListingOwnerUser
      });
    }
  }, [listing, isListingOwnerUser]);

  const handleFavoriteToggle = async () => {
    if (!listingId) return;
    if (!isAuthenticated) return router.push('/login');
    try {
      await dispatch(toggleFavorite(listingId)).unwrap();
    } catch (err) {
      console.error('Favori hatası:', err);
    }
  };

  const handleSendContact = () => {
    if (!isAuthenticated || !listingId || !messageContent.trim()) return;

    // messageType'a göre isOffer değerini belirle
    const isOffer = messageType === 'offer';

    // Eğer teklif ise, fiyat kontrolü yap
    if (isOffer) {
      if (offerPrice === '' || Number(offerPrice) <= 0) {
        setFeedback({ type: 'error', message: 'Lütfen geçerli bir teklif tutarı girin.' });
        return;
      }

      // Fiyat doğrulama: İlan fiyatının %50'sinden az, %150'sinden fazla teklif verilemesin
      const minOffer = listing!.price * 0.5;
      const maxOffer = listing!.price * 1.5;
      const priceVal = Number(offerPrice);

      if (priceVal < minOffer) {
        setFeedback({ type: 'error', message: `Teklif çok düşük. En az ${formatPrice(minOffer, listing!.type, listing!.currency)} teklif verebilirsiniz.` });
        return;
      }
      if (priceVal > maxOffer) {
        setFeedback({ type: 'error', message: `Teklif çok yüksek. En fazla ${formatPrice(maxOffer, listing!.type, listing!.currency)} teklif verebilirsiniz.` });
        return;
      }
    }

    dispatch(sendMessage({
      listingId,
      data: {
        content: messageContent.trim(),
        offerPrice: isOffer ? Number(offerPrice) : undefined,
        isOffer
      }
    })).unwrap().then(() => {
      setFeedback({ type: 'success', message: isOffer ? 'Teklifiniz başarıyla iletildi.' : 'Mesajınız başarıyla gönderildi.' });
      setShowContactModal(false);
      setMessageContent('');
      setOfferPrice('');
    }).catch(err => {
      setFeedback({ type: 'error', message: err?.message || (isOffer ? 'Teklif gönderilemedi.' : 'Mesaj gönderilemedi.') });
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
        <div className="flex gap-1.5 items-center">
          {/* Custom Tooltip Copy Button */}
          <div className="relative group/tooltip">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-all flex items-center justify-center"
            >
              <Copy className="w-4 h-4" />
            </button>
            <div className="absolute top-full right-0 mt-2 whitespace-nowrap px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg pointer-events-none opacity-0 translate-y-1 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all z-50 shadow-xl border border-white/10">
              İlan bağlantısını kopyala
            </div>
          </div>
          {!isListingOwnerUser && (
            <button
              onClick={handleFavoriteToggle}
              disabled={isToggling}
              aria-label={isFavorited ? "Favorilerden çıkar" : "Favorilere ekle"}
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
            {/* Premium Carousel Gallery */}
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 group/gallery">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-900">
                {/* Main Slider */}
                <div
                  className="flex w-full h-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                >
                  {images.map((img, idx) => (
                    <div key={img.id} className="w-full h-full shrink-0 relative">
                      <img
                        src={img.imageUrl}
                        alt={`${listing.title} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Dark gradient overlay for better visibility of controls */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300" />
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex(p => p === 0 ? images.length - 1 : p - 1); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all opacity-0 group-hover/gallery:opacity-100 translate-x-[-10px] group-hover/gallery:translate-x-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex(p => p === images.length - 1 ? 0 : p + 1); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all opacity-0 group-hover/gallery:opacity-100 translate-x-[10px] group-hover/gallery:translate-x-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Counter & Fullscreen Toggle */}
                <div className="absolute bottom-6 inset-x-6 flex items-end justify-between pointer-events-none">
                  <div className="flex gap-2 p-1 bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 pointer-events-auto">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${activeImageIndex === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-black/30 backdrop-blur-xl px-4 py-2 rounded-xl text-[10px] font-black text-white border border-white/10 tracking-[0.2em]">
                      {activeImageIndex + 1} <span className="text-white/40 mx-1">/</span> {images.length}
                    </div>
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-xl text-white border border-white/10 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all pointer-events-auto"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnails Bar */}
              {images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto p-1 pb-2 scrollbar-none snap-x">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-24 aspect-[4/3] rounded-xl overflow-hidden shrink-0 transition-all snap-start border-2 ${activeImageIndex === idx
                        ? 'border-indigo-600 ring-4 ring-indigo-500/10'
                        : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={img.imageUrl} className="w-full h-full object-cover" />
                      {activeImageIndex === idx && (
                        <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
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

            {/* Comments Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px]">💬</span>
                Yorumlar ({comments.length})
              </h2>

              {/* Comment Form - Only for authenticated users */}
              {isAuthenticated ? (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={currentUser?.name || ''}
                      surname={currentUser?.surname || ''}
                      profilePictureUrl={currentUser?.profilePictureUrl}
                      size="sm"
                    />
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Yorumunuzu yazın..."
                        className="w-full min-h-[80px] p-3 bg-white border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none text-sm text-gray-700 resize-none transition-all"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setCommentText('')}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-all"
                        >
                          İptal
                        </button>
                        <button
                          onClick={async () => {
                            if (!commentText.trim() || !listingId) return;
                            try {
                              await dispatch(createComment({
                                listingId,
                                data: {
                                  content: commentText.trim()
                                }
                              })).unwrap();
                              setCommentText('');
                              setFeedback({ type: 'success', message: 'Yorumunuz başarıyla eklendi!' });
                            } catch (err) {
                              setFeedback({ type: 'error', message: 'Yorum eklenirken bir hata oluştu.' });
                            }
                          }}
                          disabled={!commentText.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          Gönder
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                  <p className="text-sm font-bold text-blue-700 mb-2">Yorum yapmak için giriş yapmalısınız</p>
                  <Link
                    href="/login"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    Giriş Yap
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-400">Henüz yorum yapılmamış</p>
                    <p className="text-xs text-gray-400 mt-1">İlk yorumu siz yapın!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      listingId={listingId!}
                      currentUser={currentUser}
                      isAuthenticated={isAuthenticated}
                      replyingTo={replyingTo}
                      replyText={replyText}
                      setReplyingTo={setReplyingTo}
                      setReplyText={setReplyText}
                      setFeedback={setFeedback}
                      dispatch={dispatch}
                      level={0}
                    />
                  ))
                )}
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
                  <button
                    onClick={() => {
                      setMessageType('offer');
                      setShowContactModal(true);
                    }}
                    className="flex items-center justify-center gap-2 p-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Send className="w-3.5 h-3.5" /> TEKLİF GÖNDER
                  </button>
                  <button
                    onClick={() => {
                      setMessageType('message');
                      setShowContactModal(true);
                    }}
                    className="flex items-center justify-center gap-2 p-3.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">
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
                  {/* Telefon - showPhone true ise göster */}
                  {listing.owner.showPhone === true && listing.owner.phone && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"><Phone className="w-3.5 h-3.5" /></div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">TEL</span>
                        <span className="text-[10px] font-bold text-gray-700">{formatPhone(listing.owner.phone)}</span>
                      </div>
                      <a
                        href={`tel:${listing.owner.phone}`}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        ARA
                      </a>
                    </div>
                  )}

                  {/* Email - showEmail true ise göster */}
                  {listing.owner.showEmail === true && listing.owner.email && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"><Mail className="w-3.5 h-3.5" /></div>
                      <div className="flex flex-col truncate">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">POSTA</span>
                        <span className="text-[10px] font-bold text-gray-700 truncate max-w-[120px]">{listing.owner.email}</span>
                      </div>
                    </div>
                  )}

                  {/* Gizlilik mesajı - Bilgiler gizliyse */}
                  {listing.owner.showPhone !== true && listing.owner.showEmail !== true && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-lg">🔒</span>
                      <p className="text-[9px] font-bold text-amber-700 leading-tight">
                        {isListingOwnerUser
                          ? "Gizlilik ayarlarınız nedeniyle iletişim bilgileriniz başkaları tarafından görülemez."
                          : "İlan sahibi iletişim bilgilerini gizlemiştir. Mesaj göndererek iletişime geçebilirsiniz."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals using fixed positioning */}
      {showContactModal && (
        <ContactModal
          listing={listing}
          messageType={messageType}
          onClose={() => {
            setShowContactModal(false);
            setMessageContent('');
            setOfferPrice('');
          }}
          onSend={handleSendContact}
          offerPrice={offerPrice}
          setOfferPrice={setOfferPrice}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          setMessageType={setMessageType}
        />
      )}
      {showImageModal && (
        <ImageModal
          images={images}
          activeIndex={activeImageIndex}
          onClose={() => setShowImageModal(false)}
          onNavigate={setActiveImageIndex}
        />
      )}
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
function ContactModal({ listing, messageType, onClose, onSend, offerPrice, setOfferPrice, messageContent, setMessageContent, setMessageType }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">
            {messageType === 'offer' ? 'TEKLİF GÖNDER' : 'MESAJ GÖNDER'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </div>

        {/* Tab Seçimi */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setMessageType('message')}
            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${messageType === 'message'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Mesaj
          </button>
          <button
            onClick={() => setMessageType('offer')}
            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${messageType === 'offer'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Teklif
          </button>
        </div>

        {/* İlan Sahibi Bilgisi */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <UserAvatar name={listing.owner.name} surname={listing.owner.surname} profilePictureUrl={listing.owner.profilePictureUrl} size="md" />
          <span className="text-xs font-bold text-gray-800">{listing.owner.name} {listing.owner.surname}</span>
        </div>

        <div className="space-y-4">
          {/* Teklif Tutarı - Sadece teklif modunda göster */}
          {messageType === 'offer' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TUTAR</label>
              <div className="relative">
                <input
                  type="number"
                  value={offerPrice || ''}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-black text-gray-700 text-lg"
                  placeholder="Teklif tutarı"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-black">{getCurrencySymbol(listing.currency)}</span>
              </div>
            </div>
          )}

          {/* Mesaj İçeriği */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              {messageType === 'offer' ? 'NOT (OPSİYONEL)' : 'MESAJINIZ'}
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={messageType === 'offer' ? 'Teklifinizle ilgili not ekleyin...' : 'Mesajınızı yazın...'}
              className="w-full min-h-[120px] p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold text-gray-600 text-xs"
            />
          </div>
        </div>

        <button
          onClick={onSend}
          className="w-full py-3.5 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-102 transition-all"
        >
          {messageType === 'offer' ? 'TEKLİFİ GÖNDER' : 'MESAJI GÖNDER'}
        </button>
      </div>
    </div>
  );
}

function ImageModal({ images, activeIndex, onClose, onNavigate }: any) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((p: number) => (p + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((p: number) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onNavigate, images.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all z-10"
      >
        <span className="text-2xl font-light">✕</span>
      </button>

      {/* Main Image Container */}
      <div className="relative w-screen h-screen flex items-center justify-center bg-black/40">
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate((p: number) => (p === 0 ? images.length - 1 : p - 1)); }}
              className="absolute left-4 md:left-10 w-16 h-16 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20 group border border-white/5"
            >
              <ChevronLeft className="w-10 h-10 group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate((p: number) => (p === images.length - 1 ? 0 : p + 1)); }}
              className="absolute right-4 md:right-10 w-16 h-16 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20 group border border-white/5"
            >
              <ChevronRight className="w-10 h-10 group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}

        <div className="w-full h-full flex items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
          <img
            src={images[activeIndex].imageUrl}
            alt="Gallery zoom"
            className="w-full h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500"
          />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-8 text-white flex flex-col items-center gap-4">
        <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-xs font-black tracking-[0.3em]">
          {activeIndex + 1} / {images.length}
        </div>
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

// Comment Item Component with Reply Support
interface CommentItemProps {
  comment: any;
  listingId: number;
  currentUser: any;
  isAuthenticated: boolean;
  replyingTo: number | null;
  replyText: string;
  setReplyingTo: (id: number | null) => void;
  setReplyText: (text: string) => void;
  setFeedback: (feedback: { type: 'success' | 'error', message: string } | null) => void;
  dispatch: any;
  level: number;
}

function CommentItem({
  comment,
  listingId,
  currentUser,
  isAuthenticated,
  replyingTo,
  replyText,
  setReplyingTo,
  setReplyText,
  setFeedback,
  dispatch,
  level
}: CommentItemProps) {
  const maxLevel = 3; // Maksimum iç içe geçme seviyesi
  const isReplying = replyingTo === comment.id;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await dispatch(createComment({
        listingId,
        data: {
          content: replyText.trim(),
          parentCommentId: comment.id
        }
      })).unwrap();
      setReplyText('');
      setReplyingTo(null);
      setFeedback({ type: 'success', message: 'Yanıt başarıyla eklendi!' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Yanıt eklenirken bir hata oluştu.' });
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
        <UserAvatar
          name={comment.user.name}
          surname={comment.user.surname}
          profilePictureUrl={comment.user.profilePictureUrl}
          size="sm"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${comment.user.id}`}
                className="text-sm font-black text-gray-800 hover:text-blue-600 transition-colors"
              >
                {comment.user.name} {comment.user.surname}
              </Link>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-400 font-bold">
                {new Date(comment.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && level < maxLevel && (
                <button
                  onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                  className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest transition-colors"
                >
                  {isReplying ? 'İptal' : 'Yanıtla'}
                </button>
              )}
              {currentUser?.id === comment.user.id && (
                <button
                  onClick={async () => {
                    if (window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
                      try {
                        await dispatch(deleteComment({
                          listingId,
                          commentId: comment.id
                        })).unwrap();
                        setFeedback({ type: 'success', message: 'Yorum silindi.' });
                      } catch (err) {
                        setFeedback({ type: 'error', message: 'Yorum silinirken bir hata oluştu.' });
                      }
                    }
                  }}
                  className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                  Sil
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {comment.content}
          </p>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-blue-200">
              <div className="flex gap-2">
                <UserAvatar
                  name={currentUser?.name || ''}
                  surname={currentUser?.surname || ''}
                  profilePictureUrl={currentUser?.profilePictureUrl}
                  size="sm"
                />
                <div className="flex-1 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    className="w-full min-h-[60px] p-2 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg outline-none text-sm text-gray-700 resize-none transition-all"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-all"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Yanıtla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              listingId={listingId}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyingTo={setReplyingTo}
              setReplyText={setReplyText}
              setFeedback={setFeedback}
              dispatch={dispatch}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
