import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'ai', label: '🤖 الذكاء الاصطناعي' },
    { id: 'design', label: '🎨 التصميم والمونتاج' },
    { id: 'work', label: '💼 العمل والإنتاجية' },
    { id: 'other', label: 'أخرى' }
]

export const staticProductsList = [
    { id: 1, title: "Gemini", keyword: "gemini", category: "ai", icon: "🤖", tag: "الأكثر طلبًا", desc: "اشتراكات Gemini AI Pro وأدوات الذكاء الاصطناعي.", price: 0 },
    { id: 2, title: "ChatGPT", keyword: "gpt", category: "ai", icon: "💬", tag: "AI", desc: "خدمات وباقات ChatGPT المتنوعة.", price: 0 },
    { id: 3, title: "CapCut", keyword: "capcut", category: "design", icon: "✂️", tag: "فيديو", desc: "أدوات المونتاج وصناعة الفيديو.", price: 0 },
    { id: 4, title: "Canva", keyword: "canva", category: "design", icon: "🎨", tag: "تصميم", desc: "أدوات التصميم والقوالب الإبداعية.", price: 0 },
    { id: 5, title: "Lovable", keyword: "lovable", category: "ai", icon: "❤️", tag: "AI", desc: "أدوات لبناء المواقع والتطبيقات بالذكاء الاصطناعي.", price: 0 },
    { id: 6, title: "Microsoft", keyword: "microsoft", category: "work", icon: "🪟", tag: "إنتاجية", desc: "خدمات وأدوات Microsoft للإنتاجية.", price: 0 },
    { id: 7, title: "Zoom", keyword: "zoom", category: "work", icon: "📹", tag: "اجتماعات", desc: "أدوات الاجتماعات والتواصل عن بُعد.", price: 0 },
    { id: 8, title: "Duolingo", keyword: "duolingo", category: "other", icon: "🦉", tag: "تعليم", desc: "خدمات تعلّم اللغات والتدريب.", price: 0 },
    {
        id: 9,
        title: "VenteBot Test",
        keyword: "ventebot",
        category: "other",
        icon: "⚙️",
        tag: "API Test",
        desc: "منتج تجريبي منخفض التكلفة",
        price: 0.01
    },
]

export default function Home() {
    const navigate = useNavigate()
    const [activeCategory, setActiveCategory] = useState('all')

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const filteredProducts = staticProductsList.filter(product =>
        activeCategory === 'all' || product.category === activeCategory
    )

    const handleScrollToStore = () => {
        document.getElementById('store').scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl font-sans text-[#172820]">
            <section className="relative overflow-hidden rounded-[24px] md:rounded-[30px] p-8 md:p-12 mb-8 md:mb-10 shadow-[0_8px_30px_rgba(23,56,42,0.06)] bg-gradient-to-br from-[#123e30] via-[#1c674b] to-[#79a65b] text-white">
                <div className="absolute -left-16 -top-24 w-[260px] md:w-[310px] h-[260px] md:h-[310px] border border-white/10 rounded-full pointer-events-none"></div>

                <div className="relative z-10 max-w-2xl">
                    <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs md:text-sm font-bold text-[#eef7dc] mb-4 md:mb-5">
                        عالمك الرقمي في مكان واحد
                    </span>

                    <h1 className="text-[28px] md:text-5xl font-black mb-4 md:mb-5 leading-[1.35] tracking-tight">
                        كل أدواتك المفضلة،<br />في مكان واحد.
                    </h1>

                    <p className="text-[#e0eee5] text-sm md:text-base leading-relaxed max-w-lg mb-6 md:mb-8">
                        اكتشف اشتراكات الذكاء الاصطناعي والتصميم والإنتاجية — اختار الخدمة المناسبة ليك وابدأ بسهولة.
                    </p>

                    <button
                        onClick={handleScrollToStore}
                        className="bg-[#d7e77a] text-[#193a2b] font-black rounded-xl px-6 py-3.5 md:px-8 md:py-4 hover:bg-[#cbe058] transition-colors text-base w-full md:w-auto shadow-md"
                    >
                        اكتشف المنتجات
                    </button>
                </div>
            </section>

            <section id="store" className="mb-8 md:mb-10">
                <div className="mb-5 md:mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-[#123e30] mb-2">تصفّح المتجر</h2>
                    <p className="text-[#718078] text-sm font-medium">اختار الخدمة اللي محتاجها وشوف الباقات المتاحة.</p>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-4 mb-5 md:mb-6 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`whitespace-nowrap px-5 py-2.5 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-base transition-all border ${activeCategory === cat.id
                                ? 'bg-[#123e30] text-white border-[#123e30]'
                                : 'bg-white text-[#53655b] border-[#e6ece7] hover:bg-[#e9f1e9]'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                        {filteredProducts.map(product => (
                            <article
                                key={product.id}
                                className="bg-white border border-[#e6ece7] rounded-[20px] md:rounded-[22px] p-4 md:p-5 flex flex-col hover:border-[#d2e0d6] hover:-translate-y-1 hover:shadow-md transition-all duration-200 min-h-[220px] md:min-h-[240px]"
                            >
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <div className="w-[46px] h-[46px] md:w-[54px] md:h-[54px] rounded-[14px] md:rounded-2xl bg-[#eff5ef] flex items-center justify-center text-2xl md:text-3xl">
                                        {product.icon}
                                    </div>
                                    <span className="text-[10px] md:text-xs font-black px-2.5 py-1.5 rounded-full bg-[#f1f5e1] text-[#62751f] truncate">
                                        {product.tag}
                                    </span>
                                </div>

                                <h3 className="text-base md:text-lg font-black text-[#172820] mb-1.5">{product.title}</h3>
                                <p className="text-[11px] md:text-sm text-[#718078] leading-[1.7] mb-4 min-h-[40px] md:min-h-[44px]">
                                    {product.desc}
                                </p>

                                <button
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    className="w-full py-3 md:py-3.5 rounded-xl text-sm md:text-base font-black transition-colors mt-auto bg-[#1f7658] text-white hover:bg-[#123e30]"
                                >
                                    عرض المنتجات
                                </button>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white border border-dashed border-[#cbd8cf] rounded-[20px] p-8 md:p-10 text-[#718078] text-base font-medium">
                        لا توجد منتجات في هذا القسم حاليًا.
                    </div>
                )}
            </section>
        </div>
    )
}