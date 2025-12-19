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

  useEffect(() => {
    dispatch(fetchThreads());
  }, [dispatch]);

  useEffect(() => {
    if (selectedThreadId) {
      dispatch(fetchMessages(selectedThreadId));
      dispatch(markThreadRead(selectedThreadId));
    }
  }, [dispatch, selectedThreadId]);

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
      // En son mesajı bul (createdAt'e göre)
      const lastMsg = (t.messages || []).reduce<
        (typeof t.messages)[number] | undefined
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
      
      // Son mesaj içeriğini belirle - dosya varsa dosya adını göster
      let lastPreview = 'Yeni mesaj yok';
      if (lastMsg) {
        if (lastMsg.attachmentFileName) {
          lastPreview = `📎 ${lastMsg.attachmentFileName}`;
        } else if (lastMsg.content && lastMsg.content.trim()) {
          lastPreview = lastMsg.content;
        } else {
          lastPreview = 'Dosya gönderildi';
        }
      }
      
      return {
        ...t,
        displayName: formatSender(otherName),
        displaySurname: otherSurname,
        displayProfilePictureUrl: otherProfilePictureUrl,
        initial: getInitial(otherName),
        lastPreview,
        lastAt: lastMsg?.createdAt || t.lastMessageAt,
        hasUnread: unreadMap[t.id] > 0,
        lastMessageSenderId: lastMsg?.senderId,
        isOtherSeller: !isCurrentUserSeller, // current user buyer ise diğer taraf ilan sahibi
        otherUserId: isCurrentUserSeller ? t.buyerId : t.sellerId,
      };
    });
    
    // En son mesaj gönderilme tarihine göre sırala (yeni mesajlar üstte)
    return formatted.sort((a, b) => {
      const dateA = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const dateB = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return dateB - dateA; // Yeni olanlar üstte
    });
  }, [threads, currentUser, unreadMap]);

  // Görünüm: seçilmemişse sadece liste; seçilmişse sadece sohbet (tek panel)
  if (!selectedThreadId) {
    return (
      <div className="space-y-3 h-[80vh]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Mesajlaşmalar</h3>
          {isLoading && <span className="text-xs text-gray-500">Yükleniyor...</span>}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => dispatch(clearMessageError())} className="text-red-500">✕</button>
          </div>
        )}
        <div className="space-y-2 max-h-[78vh] overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
          {formattedThreads.length === 0 && !isLoading && (
            <div className="text-sm text-gray-600">Henüz mesajın yok.</div>
          )}
          {formattedThreads.map((t) => {
            const hasUnread = t.hasUnread || false;
            const isFromOther = t.lastMessageSenderId && t.lastMessageSenderId !== currentUser?.id;
            const shouldHighlight = hasUnread && isFromOther;
            const isOtherUserSelf = t.otherUserId && t.otherUserId === currentUser?.id;
            
            return (
              <div
                key={t.id}
                onClick={() => setSelectedThreadId(t.id)}
                className={`w-full text-left border rounded-xl p-3 transition cursor-pointer ${
                  selectedThreadId === t.id 
                    ? 'border-indigo-300 bg-indigo-100' 
                    : shouldHighlight
                    ? 'border-gray-300 bg-gray-100 hover:bg-gray-150'
                    : 'border-gray-100 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Diğer kullanıcının avatarı - kendi hesabıysa tıklanamaz, değilse profiline gider */}
                  {t.otherUserId && !isOtherUserSelf ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${t.otherUserId}`);
                      }}
                      className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                    >
                      <UserAvatar
                        name={t.displayName}
                        surname={t.displaySurname || ''}
                        profilePictureUrl={t.displayProfilePictureUrl}
                        size="md"
                        className="transition-transform group-hover:scale-[1.02]"
                      />
                    </button>
                  ) : (
                    <UserAvatar
                      name={t.displayName}
                      surname={t.displaySurname || ''}
                      profilePictureUrl={t.displayProfilePictureUrl}
                      size="md"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          {/* Kullanıcı adı: kendi hesabıysa düz metin, değilse profil linki */}
                          {t.otherUserId && !isOtherUserSelf ? (
                            <button
                              type="button"
                              className="font-semibold truncate text-left text-indigo-700 hover:text-indigo-900 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/profile/${t.otherUserId}`);
                              }}
                            >
                              {t.displayName} {t.displaySurname}
                            </button>
                          ) : (
                            <span className="font-semibold truncate text-left text-gray-900">
                              {t.displayName} {t.displaySurname}
                            </span>
                          )}
                          {t.isOtherSeller && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                              İlan Sahibi
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-gray-500 truncate text-left hover:text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (t.listingId) {
                              router.push(`/listing/${t.listingId}`);
                            }
                          }}
                        >
                          {t.listingTitle || 'İlan'}
                        </button>
                      </div>
                      <span className={`text-[11px] ml-2 ${
                        shouldHighlight ? 'text-gray-600 font-medium' : 'text-gray-400'
                      }`}>
                        {t.lastAt ? format(new Date(t.lastAt), 'dd.MM.yyyy HH:mm') : ''}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 truncate ${
                      shouldHighlight ? 'text-gray-800 font-medium' : 'text-gray-700'
                    }`}>
                      {t.lastPreview}
                    </div>
                  </div>
                  {unreadMap[t.id] > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] self-start font-semibold">
                      {unreadMap[t.id]}
                    </span>
                  )}
                  {/* Üç nokta menü */}
                  <div className="relative self-start ml-2">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuThreadId((prev) => (prev === t.id ? null : t.id));
                      }}
                    >
                      ⋮
                    </button>
                    {openMenuThreadId === t.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                        <button
                          className="w-full text-left text-xs px-3 py-2 hover:bg-red-50 text-red-600"
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
                          Mesajı sil
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
    });

    if (!selectedThreadId || !selectedMeta) {
      console.warn('Messages.handleSend: Thread veya meta eksik', { selectedThreadId, selectedMeta });
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
            {selectedMeta && selectedMeta.otherUserId && selectedMeta.otherUserId !== currentUser?.id ? (
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
          const senderLabel = isMine ? 'Sen' : formatSender(m.senderName);

          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isMine && (
                <button
                  type="button"
                  onClick={() => router.push(`/profile/${m.senderId}`)}
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
                className={`flex flex-col gap-1 max-w-[80%] rounded-2xl p-3 border ${
                  isMine
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-sm'
                    : 'bg-gray-50 text-gray-800 border-gray-100 rounded-bl-sm'
                }`}
              >
                <div
                  className={`flex items-center text-[11px] ${
                    isMine ? 'justify-end text-indigo-100' : 'justify-between text-gray-500'
                  }`}
                >
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() => router.push(`/profile/${m.senderId}`)}
                      className="font-semibold text-gray-700 hover:text-indigo-700 hover:underline"
                    >
                      {m.senderName} {m.senderSurname}
                    </button>
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
    </div>
  );
}

