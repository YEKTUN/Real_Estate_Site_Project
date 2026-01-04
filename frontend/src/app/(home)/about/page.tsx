import React from 'react';
import { Building2, Users, Target, Award } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="space-y-20">
            {/* Header Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">
                    Hakkımızda
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    RealEstimate olarak, gayrimenkul sektöründe güven, şeffaflık ve yenilikçi çözümlerle hizmet veriyoruz. Hayalinizdeki yaşam alanını bulmanız için buradayız.
                </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Mutlu Müşteri', value: '1000+', icon: Users },
                    { label: 'İlan Sayısı', value: '5000+', icon: Building2 },
                    { label: 'Yıllık Deneyim', value: '10+', icon: Award },
                    { label: 'Şehir', value: '81', icon: Target },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 text-center border border-gray-100">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-xl mb-4">
                            <stat.icon className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                        <div className="text-gray-500 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Vision & Mission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Target className="w-6 h-6 text-blue-600" />
                        Misyonumuz
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        Müşterilerimize en doğru gayrimenkul yatırımlarını yapmaları konusunda rehberlik etmek, teknolojinin sunduğu imkanları kullanarak süreçleri hızlandırmak ve şeffaf bir hizmet sunmaktır. Her bireyin ihtiyaçlarına özel çözümler üreterek, gayrimenkul deneyimini stressiz ve keyifli bir hale getirmeyi amaçlıyoruz.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Award className="w-6 h-6 text-purple-600" />
                        Vizyonumuz
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        Türkiye'nin lider dijital emlak platformu olmak ve global standartlarda hizmet vererek sektördeki kalite çıtasını yükseltmek. Sürdürülebilir büyüme odaklı yaklaşımımızla, hem bireysel hem de kurumsal yatırımcılar için vazgeçilmez bir iş ortağı olmayı hedefliyoruz.
                    </p>
                </div>
            </div>

            {/* Values Section */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-12">Değerlerimiz</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'Güven', desc: 'İlişkilerimizin temeli dürüstlük ve şeffaflığa dayanır.' },
                        { title: 'İnovasyon', desc: 'Sürekli gelişimi ve teknolojiyi işimizin merkezine koyarız.' },
                        { title: 'Müşteri Odaklılık', desc: 'Her kararımızda müşterilerimizin memnuniyetini önceleriz.' },
                    ].map((value, index) => (
                        <div key={index} className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors duration-300">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                            <p className="text-gray-600">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
