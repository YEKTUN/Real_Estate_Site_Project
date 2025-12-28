'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  fetchThreads,
  fetchMessages,
  selectThreads,
  selectMessagesByThread,
  selectMessageLoading,
  selectMessageSending,
  selectMessageError,
  clearMessageError,
  markThreadRead,
  deleteThreadAsync,
  selectThreadUnread,
  sendMessage,
  markMessageRead,
} from '@/body/redux/slices/message/MessageSlice';
import { selectUser } from '@/body/redux/slices/auth/AuthSlice';
import { format } from 'date-fns';
import { uploadFile, selectIsUploadingFile } from '@/body/redux/slices/cloudinary/CloudinarySlice';
import UserAvatar from '@/body/panel/components/UserAvatar';

const formatSender = (name?: string) => {
  if (name && name.trim() !== '') return name;
  return 'Bilinmeyen';
};

const getInitial = (text?: string) => {
  if (!text) return '?';
  const trimmed = text.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
};

export default function Messages() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentUser = useAppSelector(selectUser);
  const threads = useAppSelector(selectThreads);
  const isLoading = useAppSelector(selectMessageLoading);
  const isSending = useAppSelector(selectMessageSending);
  const error = useAppSelector(selectMessageError);
  const isUploadingFile = useAppSelector(selectIsUploadingFile);

  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [openMenuThreadId, setOpenMenuThreadId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  // Mesaj listesinin kendi scroll container'ı - sadece bu alanı aşağı kaydıracağız
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const messages = useAppSelector(
    selectedThreadId ? selectMessagesByThread(selectedThreadId) : () => []
  );
  const unreadMap = useAppSelector((state) => {
    const map: Record<number, number> = {};
    threads.forEach((t) => {
      map[t.id] = selectThreadUnread(t.id)(state);
    });
    return map;
  });

  // Thread'ler için cached mesajları al
  const messagesByThread = useAppSelector((state) => state.message.messagesByThread);

  useEffect(() => {
    dispatch(fetchThreads());
  }, [dispatch]);

  useEffect(() => {
    if (selectedThreadId) {
      dispatch(fetchMessages(selectedThreadId));
    }
  }, [dispatch, selectedThreadId]);

  // Thread açıldığında ve mesajlar yüklendiğinde okunmamış mesajları otomatik okundu yap
  const processedThreadIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Thread değiştiğinde processed flag'ini sıfırla
    if (processedThreadIdRef.current !== selectedThreadId) {
      processedThreadIdRef.current = null;
    }

    // Thread açık ve mesajlar yüklendiğinde, daha önce işlenmediyse okunmamış mesajları okundu yap
    if (
      selectedThreadId &&
      messages.length > 0 &&
      currentUser?.id &&
      processedThreadIdRef.current !== selectedThreadId
    ) {
      // Sadece okunmamış ve kendimizden gelmeyen mesajları okundu yap
      const unreadMessages = messages.filter(
        (m) => !m.isRead && m.senderId !== currentUser.id
      );

      // Tüm okunmamış mesajları okundu yap (sadece bir kez, thread açıldığında)
      if (unreadMessages.length > 0) {
        processedThreadIdRef.current = selectedThreadId;
        
        // Tüm okunmamış mesajları okundu yap
        const markPromises = unreadMessages.map((m) =>
          dispatch(markMessageRead({ messageId: m.id, threadId: selectedThreadId }))
        );
        
        // Tüm mesajlar okundu işaretlendikten sonra thread listesini yenile
        Promise.all(markPromises).then(() => {
          // Thread listesini yenile ki badge güncellensin
          dispatch(fetchThreads());
        }).catch((error) => {
          console.error('Mesajları okundu olarak işaretlerken hata:', error);
        });
      } else {
        // Eğer okunmamış mesaj yoksa, yine de işaretle ki tekrar kontrol etmesin
        processedThreadIdRef.current = selectedThreadId;
      }
    }
  }, [selectedThreadId, messages, currentUser?.id, dispatch]);

  // Yeni mesaj geldiğinde veya thread değiştiğinde sadece iç mesaj kutusunu en alta indir
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    try {
      // Yalnızca bu container'ın scrollTop'unu değiştiriyoruz; sayfanın (window) scroll'una dokunmuyoruz
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Messages: iç scroll ayarlanırken hata', err);
    }
  }, [messages.length, selectedThreadId]);

  const formattedThreads = useMemo(() => {
    const currentId = currentUser?.id;
    const formatted = threads.map((t) => {
      // Önce messagesByThread'den mesajları kontrol et (daha güncel olabilir)
      const cachedMessages = messagesByThread[t.id] || [];
      const threadMessages = cachedMessages.length > 0 ? cachedMessages : (t.messages || []);
      
      // Önce okunmamış mesajları bul (kendimizden gelmeyen)
      const unreadMessages = threadMessages.filter(
        (m) => !m.isRead && m.senderId !== currentId
      );
      
      // En son okunmamış mesajı bul (eğer varsa)
      const lastUnreadMsg = unreadMessages.length > 0
        ? unreadMessages.reduce<typeof threadMessages[number] | undefined>((latest, m) => {
            if (!latest) return m;
            return new Date(m.createdAt) > new Date(latest.createdAt) ? m : latest;
          }, undefined)
        : undefined;
      
      // En son mesajı bul (createdAt'e göre) - genel son mesaj
      const lastMsg = threadMessages.reduce<
        typeof threadMessages[number] | undefined
      >((latest, m) => {
        if (!latest) return m;
        return new Date(m.createdAt) > new Date(latest.createdAt) ? m : latest;
      }, undefined);
      
      const isCurrentUserSeller = currentId === t?.sellerId;
      
      // Thread'den direkt seller/buyer bilgilerini kullan
      const otherName = isCurrentUserSeller 
        ? (t.buyerName || 'Bilinmeyen')
        : (t.sellerName || 'Bilinmeyen');
      const otherSurname = isCurrentUserSeller 
        ? (t.buyerSurname || '')
        : (t.sellerSurname || '');
      const otherProfilePictureUrl = isCurrentUserSeller 
        ? (t.buyerProfilePictureUrl || null)
        : (t.sellerProfilePictureUrl || null);
      
      // Öncelikle okunmamış mesaj varsa onu göster, yoksa son mesajı göster
      const displayMsg = lastUnreadMsg || lastMsg;
      let lastPreview = 'Yeni mesaj yok';
      let isLastPreviewUnread = false;
      
      if (displayMsg) {
        isLastPreviewUnread = !!lastUnreadMsg; // Eğer gösterilen mesaj okunmamış mesajsa
        if (displayMsg.attachmentFileName) {
          lastPreview = `📎 ${displayMsg.attachmentFileName}`;
        } else if (displayMsg.content && displayMsg.content.trim()) {
          lastPreview = displayMsg.content;
        } else {
          lastPreview = 'Dosya gönderildi';
        }
      }
      
      // Admin mesajı kontrolü - son mesaj admin'den geldiyse belirginleştir
      const isLastMessageFromAdmin = lastMsg?.isAdminSender || false;
      // Admin thread'i kontrolü - diğer taraf admin ise (admin buyer olarak thread'de)
      const isAdminThread = isCurrentUserSeller && lastMsg?.isAdminSender;
      
      return {
        ...t,
        displayName: isAdminThread ? 'Sistem' : formatSender(otherName), // Admin thread'lerinde "Sistem" göster
        displaySurname: isAdminThread ? '' : otherSurname,
        displayProfilePictureUrl: isAdminThread ? null : otherProfilePictureUrl,
        initial: isAdminThread ? '⚙️' : getInitial(otherName),
        lastPreview,
        lastAt: lastMsg?.createdAt || t.lastMessageAt,
        hasUnread: unreadMap[t.id] > 0,
        lastMessageSenderId: lastMsg?.senderId,
        isOtherSeller: !isCurrentUserSeller, // current user buyer ise diğer taraf ilan sahibi
        otherUserId: isCurrentUserSeller ? t.buyerId : t.sellerId,
        isAdminThread, // Admin thread'i flag'i ekle
        isLastMessageFromAdmin, // Son mesaj admin'den mi flag'i ekle
        isLastPreviewUnread, // Son önizleme okunmamış mesaj mı flag'i
      };
    });
    
    // En son mesaj gönderilme tarihine göre sırala (yeni mesajlar üstte)
    return formatted.sort((a, b) => {
      const dateA = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const dateB = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return dateB - dateA; // Yeni olanlar üstte
    });
  }, [threads, currentUser, unreadMap, messagesByThread]);

  // Seçili thread'leri sil
  const handleDeleteSelected = async () => {
    const selectedIds = Array.from(selectedThreadIds);
    if (selectedIds.length === 0) return;

    const confirmMessage = selectedIds.length === formattedThreads.length
      ? 'Tüm mesajlaşmaları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
      : `Seçili ${selectedIds.length} mesajlaşmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedIds.map((id) => dispatch(deleteThreadAsync(id)));
      await Promise.all(deletePromises);
      
      // Seçim modunu kapat ve thread listesini yenile
      setSelectedThreadIds(new Set());
      setIsSelectMode(false);
      dispatch(fetchThreads());
    } catch (error) {
      console.error('Thread\'ler silinirken hata:', error);
      alert('Mesajlaşmalar silinirken bir hata oluştu');
    }
  };

  // Tümünü seç/kaldır
  const handleSelectAll = () => {
    if (selectedThreadIds.size === formattedThreads.length) {
      setSelectedThreadIds(new Set());
    } else {
      setSelectedThreadIds(new Set(formattedThreads.map((t) => t.id)));
    }
  };

  // Tekil thread seçimi
  const handleToggleThreadSelection = (threadId: number) => {
    setSelectedThreadIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // Görünüm: seçilmemişse sadece liste; seçilmişse sadece sohbet (tek panel)
  if (!selectedThreadId) {
    return (
      <div className="space-y-4 h-[80vh] flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Mesajlaşmalar</h3>
          <div className="flex items-center gap-2">
            {isLoading && <span className="text-xs text-gray-500">Yükleniyor...</span>}
            {formattedThreads.length > 0 && (
              <>
                {!isSelectMode ? (
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Seç
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      {selectedThreadIds.size === formattedThreads.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedThreadIds.size === 0}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Seçilenleri Sil ({selectedThreadIds.size})
                    </button>
                    {formattedThreads.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Tüm mesajlaşmaları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
                            setSelectedThreadIds(new Set(formattedThreads.map((t) => t.id)));
                            handleDeleteSelected();
                          }
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
                      >
                        Tümünü Sil
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsSelectMode(false);
                        setSelectedThreadIds(new Set());
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => dispatch(clearMessageError())} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain pr-2 -mr-2">
          {formattedThreads.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">Henüz mesajın yok.</p>
            </div>
          )}
          {formattedThreads.map((t) => {
            const hasUnread = t.hasUnread || false;
            const isFromOther = t.lastMessageSenderId && t.lastMessageSenderId !== currentUser?.id;
            const shouldHighlight = hasUnread && isFromOther;
            const isOtherUserSelf = t.otherUserId && t.otherUserId === currentUser?.id;
            
            const isSelected = selectedThreadIds.has(t.id);
            
            return (
              <div
                key={t.id}
                onClick={() => {
                  if (isSelectMode) {
                    handleToggleThreadSelection(t.id);
                  } else {
                    setSelectedThreadId(t.id);
                  }
                }}
                className={`group relative w-full border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50 shadow-md ring-2 ring-indigo-300'
                    : selectedThreadId === t.id 
                    ? 'border-indigo-400 bg-indigo-50 shadow-md' 
                    : t.isAdminThread
                    ? 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 hover:shadow-sm'
                    : shouldHighlight
                    ? 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox - seçim modunda göster */}
                  {isSelectMode && (
                    <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleThreadSelection(t.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                  {/* Avatar */}
                  {t.isAdminThread ? (
                    <div className="shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 w-14 h-14 flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-purple-200">
                      ⚙️
                    </div>
                  ) : t.otherUserId && !isOtherUserSelf ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${t.otherUserId}`);
                      }}
                      className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-transform hover:scale-105"
                    >
                      <UserAvatar
                        name={t.displayName}
                        surname={t.displaySurname || ''}
                        profilePictureUrl={t.displayProfilePictureUrl}
                        size="md"
                      />
                    </button>
                  ) : (
                    <div className="shrink-0">
                      <UserAvatar
                        name={t.displayName}
                        surname={t.displaySurname || ''}
                        profilePictureUrl={t.displayProfilePictureUrl}
                        size="md"
                      />
                    </div>
                  )}
                  
                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    {/* Üst satır: İsim, badge, zaman */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {t.isAdminThread ? (
                          <span className="font-semibold text-purple-700 text-base">
                            Sistem
                          </span>
                        ) : t.otherUserId && !isOtherUserSelf ? (
                          <button
                            type="button"
                            className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline text-base truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/profile/${t.otherUserId}`);
                            }}
                          >
                            {t.displayName} {t.displaySurname}
                          </button>
                        ) : (
                          <span className="font-semibold text-gray-900 text-base truncate">
                            {t.displayName} {t.displaySurname}
                          </span>
                        )}
                        {t.isAdminThread && (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-semibold border border-purple-200">
                            Sistem Mesajı
                          </span>
                        )}
                        {t.isOtherSeller && !t.isAdminThread && (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                            İlan Sahibi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {unreadMap[t.id] > 0 && (
                          <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold min-w-[20px] text-center">
                            {unreadMap[t.id]}
                          </span>
                        )}
                        <span className={`text-xs whitespace-nowrap ${
                          shouldHighlight ? 'text-gray-600 font-medium' : 'text-gray-400'
                        }`}>
                          {t.lastAt ? format(new Date(t.lastAt), 'dd.MM.yyyy HH:mm') : ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* İlan başlığı */}
                    <button
                      type="button"
                      className="text-xs text-indigo-600 hover:text-indigo-700 truncate block mb-2 w-full text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (t.listingId) {
                          router.push(`/listing/${t.listingId}`);
                        }
                      }}
                    >
                      {t.listingTitle || 'İlan'}
                    </button>
                    
                    {/* Mesaj önizleme - okunmamış mesaj varsa vurgulu göster */}
                    <div className={`line-clamp-2 ${
                      t.isLastPreviewUnread
                        ? 'text-base font-bold text-gray-900' // Okunmamış mesaj: büyük, kalın, koyu
                        : shouldHighlight
                        ? 'text-sm text-gray-900 font-medium'
                        : 'text-sm text-gray-600'
                    }`}>
                      {t.lastPreview}
                    </div>
                  </div>
                  
                  {/* Üç nokta menü */}
                  <div className="relative shrink-0">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuThreadId((prev) => (prev === t.id ? null : t.id));
                      }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {openMenuThreadId === t.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                        <button
                          className="w-full text-left text-sm px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Bu sohbeti mesaj kutunuzdan silmek istiyor musunuz?')) {
                              dispatch(deleteThreadAsync(t.id));
                              if (selectedThreadId === t.id) {
                                setSelectedThreadId(null);
                              }
                              setOpenMenuThreadId(null);
                            }
                          }}
                        >
                          Mesajı Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Sohbet görünümü
  const selectedMeta = formattedThreads.find((t) => t.id === selectedThreadId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('20MB üstü dosya yükleyemezsiniz.');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType?: string): string => {
    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.startsWith('video/')) return '🎥';
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊';
    return '📎';
  };

  const handleSend = async () => {
    console.log('Messages.handleSend: Başlatılıyor', {
      selectedThreadId,
      selectedMeta,
      messageText,
      hasFile: !!selectedFile,
      currentUserId: currentUser?.id,
      sellerId: selectedMeta?.sellerId,
      buyerId: selectedMeta?.buyerId,
      isAdminThread: selectedMeta?.isAdminThread,
    });

    if (!selectedThreadId || !selectedMeta) {
      console.warn('Messages.handleSend: Thread veya meta eksik', { selectedThreadId, selectedMeta });
      return;
    }

    // Admin thread'lerinde mesaj göndermeyi engelle
    if (selectedMeta.isAdminThread) {
      console.warn('Messages.handleSend: Admin thread\'lerine mesaj gönderilemez', {
        threadId: selectedThreadId,
        isAdminThread: selectedMeta.isAdminThread,
      });
      alert('Sistem mesajlarına cevap verilemez. Bu mesajlar sadece bilgilendirme amaçlıdır.');
      return;
    }

    // Not: İlan sahibi artık mevcut thread'lere mesaj gönderebilir
    // Backend'de kontrol yapılıyor: Eğer thread varsa mesaj gönderebilir, yoksa engellenir
    const isCurrentUserSeller = currentUser?.id === selectedMeta.sellerId;
    if (isCurrentUserSeller) {
      console.log('Messages.handleSend: İlan sahibi mevcut thread\'e mesaj gönderiyor', {
        listingId: selectedMeta.listingId,
        threadId: selectedThreadId,
        userId: currentUser?.id,
      });
      // Frontend'de engelleme kaldırıldı, backend kontrolü yeterli
    }

    const content = messageText.trim();
    if (!content && !selectedFile) {
      console.warn('Messages.handleSend: İçerik ve dosya yok');
      return;
    }

    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;
    let attachmentFileName: string | null = null;
    let attachmentFileSize: number | null = null;

    if (selectedFile) {
      console.log('Messages.handleSend: Dosya yükleniyor', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      });
      try {
        const uploadRes: any = await dispatch(uploadFile({ file: selectedFile, folder: 'messages' })).unwrap();
        console.log('Messages.handleSend: Dosya yükleme sonucu', { uploadRes });
        if (!uploadRes.success || !uploadRes.url) {
          alert(uploadRes.message || 'Dosya yüklenemedi');
          return;
        }
        attachmentUrl = uploadRes.url;
        attachmentType = selectedFile.type.startsWith('image/')
          ? 'image'
          : selectedFile.type.startsWith('video/')
          ? 'video'
          : 'document';
        attachmentFileName = selectedFile.name;
        attachmentFileSize = selectedFile.size;
      } catch (uploadError) {
        console.error('Messages.handleSend: Dosya yükleme hatası', uploadError);
        alert('Dosya yüklenirken hata oluştu');
        return;
      }
    }

    // İçerik yoksa ve dosya varsa, içerik olarak dosya adını (extension ile) kullan
    const fallbackContent =
      !content && selectedFile ? selectedFile.name : content || '';

    const messageData = {
      content: fallbackContent,
      isOffer: false,
      attachmentUrl,
      attachmentType,
      attachmentFileName,
      attachmentFileSize,
    };

    console.log('Messages.handleSend: Mesaj gönderiliyor', {
      listingId: selectedMeta.listingId,
      data: messageData,
    });

    try {
      const result = await dispatch(
        sendMessage({
          listingId: selectedMeta.listingId,
          data: messageData,
        })
      ).unwrap();

      console.log('Messages.handleSend: Mesaj başarıyla gönderildi', { result });

      setMessageText('');
      setSelectedFile(null);
      setAttachmentPreview(null);
    } catch (error) {
      console.error('Messages.handleSend: Mesaj gönderme hatası', {
        error,
        errorMessage: (error as any)?.message,
        errorResponse: (error as any)?.response,
      });
      
      // Backend'den gelen hata mesajını kullanıcıya göster
      const errorMessage = (error as any)?.message || 'Mesaj gönderilirken hata oluştu';
      
      // Özel hata mesajları için daha anlaşılır mesajlar
      if (errorMessage.includes('Kendi ilanınıza mesaj gönderemezsiniz') || 
          errorMessage.includes('kendi ilanınıza')) {
        alert('Kendi ilanınıza mesaj gönderemezsiniz. Bu thread\'de sadece ilanınıza mesaj gönderen kullanıcılara cevap verebilirsiniz.');
      } else if (errorMessage.includes('İlan bulunamadı')) {
        alert('İlan bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      } else {
        alert(errorMessage);
      }
    }
  };

  const renderAttachment = (m: any) => {
    if (!m.attachmentUrl) return null;
    if (m.attachmentType === 'image') {
      return (
        <img
          src={m.attachmentUrl}
          alt={m.attachmentFileName || 'image'}
          className="mt-1 max-w-full rounded-lg border border-gray-200"
        />
      );
    }
    if (m.attachmentType === 'video') {
      return (
        <video
          src={m.attachmentUrl}
          controls
          className="mt-1 max-w-full rounded-lg border border-gray-200"
        />
      );
    }
    // document
    return (
      <a
        href={m.attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-2 text-indigo-600 text-sm underline"
      >
        📄 {m.attachmentFileName || 'Dosya indir'}
      </a>
    );
  };
  return (
    <div className="border border-gray-100 rounded-2xl bg-gradient-to-b from-gray-50 to-white flex flex-col h-[90vh] overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedThreadId(null)}
            className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50"
          >
            ← Mesaj kutusu
          </button>
          <div className="flex items-center gap-2">
            {selectedMeta?.isAdminThread ? (
              // Admin thread'leri için özel görünüm
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 w-10 h-10 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  ⚙️
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-purple-700 leading-tight">
                      Sistem Mesajları
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">
                      Sistem Mesajı
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-indigo-600 text-left"
                    onClick={() => {
                      if (selectedMeta.listingId) {
                        router.push(`/listing/${selectedMeta.listingId}`);
                      }
                    }}
                  >
                    {selectedMeta.listingTitle || ''}
                  </button>
                </div>
              </div>
            ) : selectedMeta && selectedMeta.otherUserId && selectedMeta.otherUserId !== currentUser?.id ? (
              <button
                type="button"
                onClick={() => router.push(`/profile/${selectedMeta.otherUserId}`)}
                className="flex items-center gap-2 group"
              >
                <UserAvatar
                  name={selectedMeta.displayName || 'Bilinmeyen'}
                  surname={selectedMeta.displaySurname || ''}
                  profilePictureUrl={selectedMeta.displayProfilePictureUrl}
                  size="md"
                  className="group-hover:ring-2 group-hover:ring-indigo-500/60"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-gray-900 leading-tight group-hover:text-indigo-700">
                      {selectedMeta.displayName || 'Sohbet'} {selectedMeta.displaySurname}
                    </h4>
                    {currentUser?.id === selectedMeta.buyerId &&
                      selectedMeta.displayName === formatSender(selectedMeta.sellerName) && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                          İlan Sahibi
                        </span>
                      )}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-indigo-600 text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedMeta.listingId) {
                        router.push(`/listing/${selectedMeta.listingId}`);
                      }
                    }}
                  >
                    {selectedMeta.listingTitle || ''}
                  </button>
                </div>
              </button>
            ) : (
              <>
                <UserAvatar
                  name={selectedMeta?.displayName || 'Bilinmeyen'}
                  surname={selectedMeta?.displaySurname || ''}
                  profilePictureUrl={selectedMeta?.displayProfilePictureUrl}
                  size="md"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-gray-900 leading-tight">
                      {selectedMeta?.displayName || 'Sohbet'} {selectedMeta?.displaySurname}
                    </h4>
                    {selectedMeta &&
                      currentUser?.id === selectedMeta.buyerId &&
                      selectedMeta.displayName === formatSender(selectedMeta.sellerName) && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                          İlan Sahibi
                        </span>
                      )}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-indigo-600 text-left"
                    onClick={() => {
                      if (selectedMeta?.listingId) {
                        router.push(`/listing/${selectedMeta.listingId}`);
                      }
                    }}
                  >
                    {selectedMeta?.listingTitle || ''}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {isSending && <span className="text-xs text-gray-500">Gönderiliyor...</span>}
      </div>
      {/* Mesaj listesi - sabit yükseklik içinde sadece dikey scroll, yatay scroll gizli */}
      <div
        ref={messagesContainerRef}
        className="flex-1 px-4 py-3 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        {messages.length === 0 && <div className="text-sm text-gray-600">Mesaj yok.</div>}
        {messages.map((m) => {
          const isMine = m.senderId === currentUser?.id;
          const isUnread = !m.isRead && !isMine; // Sadece kendi mesajlarımız dışındaki okunmamış mesajlar
          
          // Mesaj tıklandığında okundu olarak işaretle
          const handleMessageClick = () => {
            if (isUnread && selectedThreadId) {
              dispatch(markMessageRead({ messageId: m.id, threadId: selectedThreadId }));
            }
          };
          
          return (
            <div 
              key={m.id} 
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2 cursor-pointer transition-all`}
              onClick={handleMessageClick}
            >
              {!isMine && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${m.senderId}`);
                  }}
                  className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                >
                  <UserAvatar
                    name={m.senderName}
                    surname={m.senderSurname || ''}
                    profilePictureUrl={m.senderProfilePictureUrl}
                    size="sm"
                    className="hover:scale-[1.03] transition-transform"
                  />
                </button>
              )}
              <div
                className={`flex flex-col gap-1 max-w-[80%] rounded-2xl p-3 border transition-all ${
                  isMine
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-sm'
                    : m.isAdminSender
                    ? isUnread
                      ? 'bg-purple-100 text-purple-900 border-purple-300 rounded-bl-sm shadow-md ring-2 ring-purple-200'
                      : 'bg-purple-50 text-purple-900 border-purple-200 rounded-bl-sm shadow-sm'
                    : isUnread
                    ? 'bg-blue-50 text-gray-900 border-blue-300 rounded-bl-sm shadow-md ring-2 ring-blue-200'
                    : 'bg-gray-50 text-gray-800 border-gray-100 rounded-bl-sm'
                }`}
              >
                <div
                  className={`flex items-center text-[11px] ${
                    isMine ? 'justify-end text-indigo-100' : 'justify-between text-gray-500'
                  }`}
                >
                  {!isMine && (
                    <div className="flex items-center gap-2">
                      {m.isAdminSender ? (
                        // Admin mesajlarında profil linki yok, sadece "Sistem" göster
                        <span className="font-semibold text-purple-700">
                          Sistem
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${m.senderId}`);
                          }}
                          className="font-semibold text-gray-700 hover:text-indigo-700 hover:underline"
                        >
                          {m.senderName} {m.senderSurname}
                        </button>
                      )}
                      {m.isAdminSender && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold border border-purple-200">
                          Sistem Mesajı
                        </span>
                      )}
                      {isUnread && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                          YENİ
                        </span>
                      )}
                    </div>
                  )}
                  <span className={isMine ? 'ml-2' : ''}>
                    {format(new Date(m.createdAt), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
                {m.isOffer && m.offerPrice !== undefined && (
                  <div
                    className={
                      isMine
                        ? 'text-yellow-200 text-sm font-semibold'
                        : 'text-emerald-700 text-sm font-semibold'
                    }
                  >
                    Teklif: {m.offerPrice}
                  </div>
                )}
                <div className={`text-sm ${isMine ? 'text-white' : 'text-gray-800'}`}>
                  {m.content}
                </div>
                {renderAttachment(m)}
              </div>
              {isMine && (
                <UserAvatar
                  name={currentUser?.name || 'Sen'}
                  surname={currentUser?.surname || ''}
                  profilePictureUrl={currentUser?.profilePictureUrl}
                  size="sm"
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Admin thread'lerinde mesaj gönderme engellenir */}
      {selectedMeta?.isAdminThread ? (
        <div className="border-t border-purple-200 bg-purple-50/30">
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h4 className="text-sm font-semibold text-purple-900 mb-2">
              Sistem Mesajlarına Cevap Verilemez
            </h4>
            <p className="text-xs text-purple-700 max-w-md mx-auto">
              Bu sistem mesajları sadece bilgilendirme amaçlıdır. Bu mesajlara cevap veremezsiniz.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`border-t border-gray-200 bg-white relative ${
            isDragging ? 'bg-indigo-50' : ''
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag and Drop Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-indigo-500/20 border-2 border-dashed border-indigo-400 flex items-center justify-center z-50">
              <div className="text-center bg-white px-6 py-4 rounded-xl shadow-lg">
                <div className="text-5xl mb-3">📎</div>
                <div className="text-indigo-700 font-bold text-lg">Dosyayı buraya bırakın</div>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3">
            {/* Dosya Önizleme */}
            {attachmentPreview && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200">
                <div className="w-20 h-20 rounded-lg border-2 border-indigo-300 overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <img src={attachmentPreview} alt="preview" className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedFile && formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setAttachmentPreview(null);
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Kaldır"
                >
                  <span className="text-red-600 text-xl">✕</span>
                </button>
              </div>
            )}

            {selectedFile && !attachmentPreview && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
                <div className="w-14 h-14 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-indigo-200">
                  <span className="text-3xl">{getFileIcon(selectedFile.name, selectedFile.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Kaldır"
                >
                  <span className="text-red-600 text-xl">✕</span>
                </button>
              </div>
            )}

            {/* Mesaj Gönderme Alanı */}
            <div className="flex items-end gap-3">
              {/* Dosya Ekleme Butonu */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-900 cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-95"
                title="Dosya ekle"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-2xl">📎</span>
              </button>

              {/* Mesaj Input - Basit ve temiz */}
              <div className="flex-1 relative">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 resize-none bg-white"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isSending && !isUploadingFile && (messageText.trim() || selectedFile)) {
                        handleSend();
                      }
                    }
                  }}
                />
                {isUploadingFile && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-indigo-600 bg-white px-2 py-1 rounded-lg shadow-sm">
                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Yükleniyor...</span>
                  </div>
                )}
              </div>

              {/* Gönder Butonu */}
              <button
                onClick={handleSend}
                disabled={isSending || isUploadingFile || (!messageText.trim() && !selectedFile)}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 disabled:active:scale-100"
                title="Gönder (Enter)"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-xl font-bold">➤</span>
                )}
              </button>
            </div>

            {/* Dosya Formatları Bilgisi */}
            <div className="text-xs text-gray-500 text-center pt-1">
              Resim, Video, PDF, Word, Excel (Maks. 20MB) • Dosyayı sürükleyip bırakabilirsiniz
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

