"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        setFormStatus('success');
        setTimeout(() => setFormStatus('idle'), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    İletişime Geçin
                </h1>
                <p className="text-base text-gray-600 max-w-xl mx-auto">
                    Sorularınız veya iş birlikleri için bize ulaşın. Ekibimiz en kısa sürede dönüş yapacaktır.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Contact Info Cards */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">Telefon</h3>
                            <p className="text-sm text-gray-600">+90 212 555 1234</p>
                            <p className="text-slate-400 text-xs mt-0.5">Hafta içi: 09:00 - 18:00</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">E-posta</h3>
                            <p className="text-sm text-gray-600">info@realestimate.com</p>
                            <p className="text-slate-400 text-xs mt-0.5">7/24 Bize yazabilirsiniz</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">Merkez Ofis</h3>
                            <p className="text-sm text-gray-600">
                                Levent Mah. Büyükdere Cad.<br />
                                No: 123 K: 5, Beşiktaş, İstanbul
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-5">Mesaj Gönderin</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Adınız Soyadınız</label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200 text-sm"
                                        placeholder="Adınız Soyadınız"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest">E-posta Adresiniz</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200 text-sm"
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="subject" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Konu</label>
                                <select
                                    id="subject"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200 bg-white text-sm"
                                >
                                    <option value="">Seçiniz...</option>
                                    <option value="buy">Satın Alma</option>
                                    <option value="sell">Satış</option>
                                    <option value="rent">Kiralama</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mesajınız</label>
                                <textarea
                                    id="message"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200 resize-none text-sm"
                                    placeholder="Mesajınızı buraya yazınız..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full md:w-auto px-10 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                            >
                                <Send className="w-4 h-4" />
                                Mesajı Gönder
                            </button>

                            {formStatus === 'success' && (
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-center text-sm font-bold animate-in fade-in slide-in-from-top-2">
                                    Mesajınız başarıyla gönderildi!
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
