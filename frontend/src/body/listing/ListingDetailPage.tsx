'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  selectCommentError,
} from '@/body/redux/slices/comment/CommentSlice';
import { sendMessage } from '@/body/redux/slices/message/MessageSlice';
import { formatPrice } from './components/formatPrice';
import UserAvatar from '../panel/components/UserAvatar';

/**
 * İlan Detay Sayfası
 *
 * /listing/[slug] route'u için dinamik sayfa.
 * slug parametresi ilan ID'si olmalı.
 */
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
  const isCommentsLoading = useAppSelector(selectCommentLoading);
  const commentError = useAppSelector(selectCommentError);

  const [commentText, setCommentText] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [offerNote, setOfferNote] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  // İlan sahibi bilgisi (listing henüz yüklenmemiş olabilir, o yüzden null-check ile)
  const listingOwnerId = listing?.owner.id ?? null;
  const isListingOwnerUser =
    !!listingOwnerId && currentUser?.id === listingOwnerId;

  // İlan sahibi bilgisi üstte belirlendi; diğer kullanıcılar için ek bloklama yok,
  // sadece alt yorum yazma kurallarında kullanılacak.

  useEffect(() => {
    console.log('ListingDetailPage: slug alındı', { slug: params?.slug, listingId });
    if (listingId === null) return;

    dispatch(fetchListingById(listingId));
    dispatch(fetchListingComments(listingId));

    return () => {
      dispatch(clearCurrentListing());
      dispatch(clearError());
    };
  }, [dispatch, listingId, params?.slug]);

  const handleFavoriteToggle = async () => {
    if (listingId === null) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await dispatch(toggleFavorite(listingId)).unwrap();
    } catch (err) {
      console.error('Favori toggle hatası (detail):', err);
    }
  };

  const handleSubmitComment = async () => {
    if (listingId === null) return;
    if (!ensureAuth()) return;

    // İlan sahibi kendi başına yeni yorum atamasın, sadece mevcut yorumlara cevap verebilsin
    if (isListingOwnerUser) {
      alert('İlan sahibi olarak yeni yorum ekleyemezsiniz. Yalnızca mevcut yorumlara cevap yazabilirsiniz.');
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed || trimmed.length < 5) {
      alert('Yorum en az 5 karakter olmalıdır.');
      return;
    }

    try {
      await dispatch(createComment({ listingId, data: { content: trimmed } })).unwrap();
      setCommentText('');
    } catch (err) {
      console.error('Yorum ekleme hatası:', err);
    }
  };

  const ensureAuth = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const handleSendOffer = () => {
    if (!ensureAuth() || listingId === null) return;
    if (offerPrice === '' || Number(offerPrice) <= 0) return;

    dispatch(
      sendMessage({
        listingId,
        data: {
          content: offerNote || 'Teklif',
          offerPrice: Number(offerPrice),
          isOffer: true,
        },
      })
    )
      .unwrap()
      .then(() => {
        setFeedback(`Teklifin iletildi: ${offerPrice} fiyatıyla. Mesaj: ${offerNote || '—'}`);
        setShowOfferModal(false);
      })
      .catch((err) => {
        console.error('Teklif gönderilemedi:', err);
        const msg = (err as any)?.message || (err as any)?.response?.data?.message || 'Teklif gönderilemedi';
        setFeedback(msg);
      });
  };

  const handleSendMessage = () => {
    if (!ensureAuth() || listingId === null) return;
    const trimmed = directMessage.trim();
    if (!trimmed) return;

    dispatch(
      sendMessage({
        listingId,
        data: {
          content: trimmed,
          isOffer: false,
        },
      })
    )
      .unwrap()
      .then(() => {
        setFeedback('Mesajın gönderildi. Mesajlaşma geçmişi oluşturuldu.');
        setShowMessageModal(false);
        setDirectMessage('');
      })
      .catch((err) => {
        console.error('Mesaj gönderilemedi:', err);
        const msg = (err as any)?.message || (err as any)?.response?.data?.message || 'Mesaj gönderilemedi';
        setFeedback(msg);
      });
  };

  if (listingId === null) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Geçersiz ilan bilgisi</h1>
        <p className="text-gray-600 mt-2">URL'deki ilan ID'si hatalı.</p>
        <button
          onClick={() => router.push('/listing')}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          İlan listesine dön
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <h2 className="text-xl font-semibold text-red-700">İlan yüklenemedi</h2>
        <p className="text-red-600 mt-2">{error}</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => dispatch(fetchListingById(listingId))}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Tekrar dene
          </button>
          <button
            onClick={() => router.push('/listing')}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            İlan listesine dön
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">İlan bulunamadı</h1>
        <p className="text-gray-600 mt-2">İlan bilgisi getirilemedi.</p>
        <button
          onClick={() => router.push('/listing')}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          İlan listesine dön
        </button>
      </div>
    );
  }

  const coverImage = listing.images.find((img) => img.isCoverImage) ?? listing.images[0];
  const isFavorited = favoriteIds.includes(listing.id);

  return (
    <div className="space-y-6">
      {/* Kapak Görseli */}
      {coverImage && (
        <div className="aspect-[16/9] overflow-hidden rounded-2xl shadow-md bg-gray-100">
          <img
            src={coverImage.imageUrl}
            alt={coverImage.altText || listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* İşlem geri bildirimi */}
      {feedback && (
        <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl">
          {feedback}
        </div>
      )}

      {/* Başlık ve Fiyat */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-gray-600">
            {listing.city} / {listing.district} {listing.neighborhood ? ` - ${listing.neighborhood}` : ''}
          </p>
          <p className="text-sm text-gray-500 mt-1">İlan No: {listing.listingNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-indigo-700">{formatPrice(listing.price, listing.type, listing.currency)}</p>
          {listing.monthlyDues && (
            <p className="text-sm text-gray-600">Aidat: {formatPrice(listing.monthlyDues, listing.type, listing.currency)}</p>
          )}
          {listing.deposit && (
            <p className="text-sm text-gray-600">Depozito: {formatPrice(listing.deposit, listing.type, listing.currency)}</p>
          )}
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleFavoriteToggle}
          disabled={isToggling}
          className={`px-4 py-2 rounded-lg border transition ${
            isFavorited
              ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isFavorited ? 'Favoriden çıkar' : 'Favorilere ekle'}
        </button>
        <button
          onClick={() => {
            setOfferPrice(listing.price);
            setOfferNote('');
            setShowOfferModal(true);
            setFeedback(null);
          }}
          className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
        >
          Teklif Gönder
        </button>
        <button
          onClick={() => {
            setShowMessageModal(true);
            setFeedback(null);
          }}
          className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
        >
          Mesaj Gönder
        </button>
        <button
          onClick={() => router.push('/listing')}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
        >
          Listeye dön
        </button>
      </div>

      {/* Teklif Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Teklif Gönder</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-gray-600">
              İlan sahibi: <span className="font-semibold">{listing.owner.name} {listing.owner.surname}</span>
            </p>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Teklif Tutarı</label>
              <input
                type="number"
                min={1}
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Not (opsiyonel)</label>
              <textarea
                value={offerNote}
                onChange={(e) => setOfferNote(e.target.value)}
                placeholder="Teklifine ek not ekle..."
                className="w-full min-h-[80px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSendOffer}
                disabled={offerPrice === '' || Number(offerPrice) <= 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                Teklifi Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mesaj Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">İlan Sahibine Mesaj</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-gray-600">
              {listing.owner.name} {listing.owner.surname} ile mesajlaşma başlat.
            </p>
            <textarea
              value={directMessage}
              onChange={(e) => setDirectMessage(e.target.value)}
              placeholder="Mesajını yaz..."
              className="w-full min-h-[120px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSendMessage}
                disabled={directMessage.trim() === ''}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Mesaj Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detaylar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <section className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Açıklama</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </section>

          <section className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Özellikler</h3>
            <div className="grid grid-cols-2 gap-3 text-gray-700">
              <div>Oda Sayısı: {listing.roomCount || '-'}</div>
              <div>Banyo Sayısı: {listing.bathroomCount ?? '-'}</div>
              <div>Net / Brüt m²: {listing.netSquareMeters ?? '-'} / {listing.grossSquareMeters ?? '-'}</div>
              <div>Kat: {listing.floorNumber ?? '-'} / {listing.totalFloors ?? '-'}</div>
              <div>Isınma: {listing.heatingType ?? '-'}</div>
              <div>Bina Yaşı: {listing.buildingAge ?? '-'}</div>
              <div>Krediye Uygun: {listing.isSuitableForCredit ? 'Evet' : 'Hayır'}</div>
              <div>Takasa Uygun: {listing.isSuitableForTrade ? 'Evet' : 'Hayır'}</div>
            </div>
          </section>

          {/* Yorumlar */}
          <section className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Yorumlar</h3>
              <span className="text-sm text-gray-500">({comments?.length || 0})</span>
            </div>

            {commentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
                {commentError}
              </div>
            )}

            <div className="space-y-3">
              {isCommentsLoading && (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              )}

              {!isCommentsLoading && (comments?.length || 0) === 0 && (
                <p className="text-gray-600">Henüz yorum yok. İlk yorumu sen yaz.</p>
              )}

              {!isCommentsLoading && comments && comments.length > 0 && (
                <div className="space-y-4">
                  {([...comments]
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    )
                  ).map((comment) => {
                    const isListingOwnerComment = comment.user.id === listingOwnerId;
                    const isReplyingHere = replyingToCommentId === comment.id;
                    const isUserCommentAuthor = currentUser?.id === comment.user.id;
                    const ownerHasRepliedToThisComment = comment.replies.some(
                      (r) => r.user.id === listingOwnerId
                    );

                    // Alt yorum yazma kuralları:
                    // - İlan sahibi: her yorumun altına cevap yazabilir
                    // - İlanı inceleyen kullanıcı: Sadece kendi yorumunun altına,
                    //   ve ancak ilan sahibi o yoruma en az bir kez cevap yazdıktan sonra
                    const canReplyHere =
                      !!currentUser &&
                      (isListingOwnerUser ||
                        (isUserCommentAuthor && ownerHasRepliedToThisComment));

                    const handleStartReply = () => {
                      if (!canReplyHere) return;
                      if (!ensureAuth()) return;

                      console.log('ListingDetailPage: Yorum yanıtlanıyor', {
                        listingId,
                        commentId: comment.id,
                        userId: currentUser?.id,
                        isListingOwnerUser,
                      });

                      setReplyingToCommentId(comment.id);
                      setReplyText('');
                    };

                    const handleSendReply = async () => {
                      if (!canReplyHere || listingId === null) return;
                      if (!ensureAuth()) return;

                      const trimmed = replyText.trim();
                      if (!trimmed || trimmed.length < 5) {
                        alert('Yorum yanıtı en az 5 karakter olmalıdır.');
                        return;
                      }

                      try {
                        await dispatch(
                          createComment({
                            listingId,
                            data: {
                              content: trimmed,
                              parentCommentId: comment.id,
                            },
                          })
                        ).unwrap();
                        setReplyText('');
                        setReplyingToCommentId(null);
                      } catch (err) {
                        console.error('Yorum yanıtı gönderilemedi:', err);
                      }
                    };

                    const canDeleteComment =
                      !!currentUser && currentUser.id === comment.user.id;

                    const handleDeleteComment = async () => {
                      if (!canDeleteComment || listingId === null) return;
                      if (!ensureAuth()) return;

                      const ok = window.confirm('Yorumu silmek istediğinize emin misiniz?');
                      if (!ok) return;

                      try {
                        await dispatch(
                          deleteComment({ listingId, commentId: comment.id })
                        ).unwrap();
                      } catch (err) {
                        console.error('Yorum silme hatası:', err);
                      }
                    };

                    return (
                      <div key={comment.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={comment.user.name}
                              surname={comment.user.surname}
                              profilePictureUrl={comment.user.profilePictureUrl}
                              size="md"
                            />
                            <span className="font-semibold">
                              {comment.user.name} {comment.user.surname}
                            </span>
                            {isListingOwnerComment && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                                İlan Sahibi
                              </span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {comment.isEdited && <span className="text-gray-400">(düzenlendi)</span>}
                          </div>
                          {canDeleteComment && (
                            <button
                              type="button"
                              onClick={handleDeleteComment}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Sil
                            </button>
                          )}
                        </div>
                        <p className="text-gray-800">{comment.content}</p>

                        {/* Yanıtlar */}
                        {comment.replies.length > 0 && (
                          <div className="mt-2 space-y-3 border-l-2 border-gray-200 pl-3">
                            {[...comment.replies]
                              .slice()
                              .sort(
                                (a, b) =>
                                  new Date(a.createdAt).getTime() -
                                  new Date(b.createdAt).getTime()
                              )
                              .map((reply) => {
                                const isListingOwnerReply = reply.user.id === listingOwnerId;
                                const canDeleteReply =
                                  !!currentUser && currentUser.id === reply.user.id;

                                const handleDeleteReply = async () => {
                                  if (!canDeleteReply || listingId === null) return;
                                  if (!ensureAuth()) return;

                                  const ok = window.confirm('Bu yanıtı silmek istediğinize emin misiniz?');
                                  if (!ok) return;

                                  try {
                                    await dispatch(
                                      deleteComment({ listingId, commentId: reply.id })
                                    ).unwrap();
                                  } catch (err) {
                                    console.error('Yorum yanıtı silme hatası:', err);
                                  }
                                };

                                return (
                                  <div key={reply.id} className="bg-white border border-gray-100 rounded-lg p-3">
                                    <div className="flex items-center justify-between gap-2 text-sm text-gray-700 mb-1">
                                      <div className="flex items-center gap-2">
                                        <UserAvatar
                                          name={reply.user.name}
                                          surname={reply.user.surname}
                                          profilePictureUrl={reply.user.profilePictureUrl}
                                          size="sm"
                                        />
                                        <span className="font-semibold">
                                          {reply.user.name} {reply.user.surname}
                                        </span>
                                        {isListingOwnerReply && (
                                          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                                            İlan Sahibi
                                          </span>
                                        )}
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">
                                          {new Date(reply.createdAt).toLocaleDateString()}
                                        </span>
                                        {reply.isEdited && <span className="text-gray-400">(düzenlendi)</span>}
                                      </div>
                                      {canDeleteReply && (
                                        <button
                                          type="button"
                                          onClick={handleDeleteReply}
                                          className="text-xs text-red-500 hover:text-red-700"
                                        >
                                          Sil
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-gray-800">{reply.content}</p>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* Yanıt yazma alanı - giriş yapmış herkes cevap yazabilir */}
                        {canReplyHere && (
                          <div className="pt-2 border-t border-gray-200 mt-2 space-y-2">
                            {!isReplyingHere ? (
                              <button
                                type="button"
                                onClick={handleStartReply}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Yanıt Yaz
                              </button>
                            ) : (
                              <div className="space-y-2">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Yalnızca ilan sahibi ile bu yorumu yazan kullanıcı arasında mesajlaşma yapılabilir..."
                                    className="w-full min-h-[60px] p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingToCommentId(null);
                                      setReplyText('');
                                    }}
                                    className="px-3 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-100"
                                  >
                                    Vazgeç
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSendReply}
                                    disabled={replyText.trim().length < 5}
                                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    Yanıtı Gönder
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Yorum yazma alanı */}
            <div className="space-y-2">
              {!isAuthenticated && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg">
                  Yorum yapmak için giriş yapmalısın.
                </div>
              )}
              {isAuthenticated && isListingOwnerUser && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
                  İlan sahibi olarak yeni yorum ekleyemezsiniz. Yalnızca kullanıcıların yazdığı yorumlara cevap yazabilirsiniz.
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  !isAuthenticated
                    ? 'Yorum yazmak için giriş yapmalısınız...'
                    : isListingOwnerUser
                    ? 'İlan sahibi olarak burada yeni yorum ekleyemezsiniz.'
                    : 'Yorumunuzu yazın...'
                }
                className="w-full min-h-[100px] p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!isAuthenticated || isListingOwnerUser}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={
                    !isAuthenticated ||
                    isListingOwnerUser ||
                    commentText.trim().length < 5
                  }
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Yorum Gönder
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">İlan Bilgileri</h3>
            <div className="space-y-2 text-gray-700">
              <div>Durum: {listing.status}</div>
              <div>Tür: {listing.type}</div>
              <div>Kategori: {listing.category}</div>
              <div>Mülk Tipi: {listing.propertyType}</div>
              <div>Yayın Tarihi: {listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString() : '-'}</div>
              <div>Görüntülenme: {listing.viewCount}</div>
              <div>Favori: {listing.favoriteCount}</div>
            </div>
          </section>

          <section className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">İlan Sahibi</h3>
            <div className="space-y-1 text-gray-700">
              <button
                type="button"
                onClick={() => router.push(`/profile/${listing.owner.id}`)}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
              >
                {listing.owner.name} {listing.owner.surname}
              </button>
              {listing.owner.phone && <div>Telefon: {listing.owner.phone}</div>}
              {listing.owner.email && <div>Email: {listing.owner.email}</div>}
              <div>Üyelik: {new Date(listing.owner.memberSince).toLocaleDateString()}</div>
              <div>Toplam İlan: {listing.owner.totalListings}</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

