import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2, X } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { staticProductsList } from './Home'
import { supabase } from '../supabaseClient'

const extractPrice = (plan) => {
    let price = 0;
    if (plan.price_tiers && Array.isArray(plan.price_tiers) && plan.price_tiers.length > 0) {
        price = plan.price_tiers[0].price_usd ?? plan.price_tiers[0].price ?? 0;
    } else {
        price = plan.price_usd ?? plan.price ?? 0;
    }
    return parseFloat(price) || 0;
}

export default function ProductDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { apiProducts, isLoading, exchangeRate } = useAppContext()

    const [modalPlan, setModalPlan] = useState(null)
    const [pricingRules, setPricingRules] = useState([])
    const [rulesLoaded, setRulesLoaded] = useState(false)

    const parentProduct = location.state?.productData || staticProductsList.find(p => p.id === parseInt(id)) || staticProductsList.find(p => p.id === id)

    useEffect(() => {
        window.scrollTo(0, 0)
        fetchPricingRules()
    }, [])

    const fetchPricingRules = async () => {
        const { data, error } = await supabase.from('pricing_rules').select('*')
        if (error) console.error("Error fetching rules:", error)
        if (data) setPricingRules(data)
        setRulesLoaded(true)
    }

    const getFinalPrice = (basePrice, planId) => {
        let rule = pricingRules.find(r => r.target_type === 'product' && String(r.target_id) === String(planId));

        if (!rule) {
            rule = pricingRules.find(r => r.target_type === 'global');
        }

        if (!rule) return basePrice;

        const multiplier = parseFloat(rule.margin_percentage || 0);
        const fixed = parseFloat(rule.fixed_markup || 0);

        let finalPrice = basePrice;
        if (multiplier > 0) {
            finalPrice = basePrice * multiplier;
        }

        return finalPrice + fixed;
    }

    if (!parentProduct) return null

    const availablePlans = apiProducts.filter(p => {
        const searchString = `${p.name || ''} ${p.title || ''}`.toLowerCase();
        return searchString.includes(parentProduct.keyword.toLowerCase());
    })

    const handleCheckout = (plan, finalPrice, costPrice) => {
        const isOutOfStock = plan.stock <= 0 || plan.in_stock === false || plan.status === 'out_of_stock' || plan.status === 'inactive';
        if (!isOutOfStock) {
            navigate(`/checkout/${plan.id || Math.random()}`, {
                state: {
                    planData: plan,
                    parentIcon: parentProduct.icon,
                    finalPrice: finalPrice,
                    costPrice: costPrice
                }
            })
        }
    }

    const checkOutOfStock = (plan) => {
        return plan.stock <= 0 || plan.in_stock === false || plan.status === 'out_of_stock' || plan.status === 'inactive';
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl font-sans relative">
            <style>{`
        .visible-scrollbar::-webkit-scrollbar { width: 5px; }
        .visible-scrollbar::-webkit-scrollbar-track { background: #f5f7f4; border-radius: 10px; }
        .visible-scrollbar::-webkit-scrollbar-thumb { background: #cbd8cf; border-radius: 10px; }
        .visible-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd8cf #f5f7f4; }
      `}</style>

            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#718078] hover:text-[#123e30] transition-colors mb-6 bg-white px-4 py-2 rounded-full border border-[#e6ece7] w-fit">
                <ArrowRight className="w-4 h-4" /> رجوع للأقسام
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-[#eff5ef] rounded-[16px] flex items-center justify-center text-3xl shadow-sm border border-[#e6ece7]">
                    {parentProduct.icon}
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#123e30]">{parentProduct.title}</h1>
                    <p className="text-[#718078] text-xs md:text-sm font-medium mt-1">اختر المناسب لاحتياجاتك</p>
                </div>
            </div>

            {isLoading || !rulesLoaded ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] border border-[#e6ece7]">
                    <Loader2 className="w-10 h-10 text-[#1f7658] animate-spin" />
                    <p className="text-sm font-bold text-[#718078] mt-4">جاري جلب الباقات والأسعار...</p>
                </div>
            ) : availablePlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {availablePlans.map((plan, idx) => {
                        const planName = plan.name || plan.title || `باقة ${idx + 1}`;
                        const costPrice = extractPrice(plan);
                        const finalPrice = getFinalPrice(costPrice, plan.id);

                        const planDesc = plan.description || plan.short_description || "تفاصيل الباقة غير متوفرة.";
                        const isOutOfStock = checkOutOfStock(plan);

                        return (
                            <div
                                key={idx}
                                onClick={() => setModalPlan({ ...plan, finalPrice, costPrice })}
                                className={`cursor-pointer bg-white border rounded-[20px] p-5 flex flex-col relative overflow-hidden transition-all ${isOutOfStock ? 'border-[#e6ece7] opacity-75' : 'border-[#e6ece7] hover:border-[#d2e0d6] hover:shadow-sm hover:-translate-y-1'}`}
                            >
                                {isOutOfStock && (
                                    <div className="w-fit mr-auto mb-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black px-2.5 py-1 rounded-md">
                                        نفد المخزون
                                    </div>
                                )}

                                <h3 className="text-sm md:text-base font-black text-[#172820] mb-2 leading-relaxed">
                                    {planName}
                                </h3>

                                <div className="mb-4">
                                    <p className="text-[11px] md:text-xs text-[#718078] leading-relaxed line-clamp-2">
                                        {planDesc}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#f5f7f4]">
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black text-[#1f7658] leading-none" dir="ltr">
                                            ${finalPrice.toFixed(2)}
                                        </span>
                                        {exchangeRate > 0 && (
                                            <span className="text-[11px] font-bold text-[#718078] mt-1.5" dir="rtl">
                                                ≈ {(finalPrice * exchangeRate).toFixed(2)} جنيه
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCheckout(plan, finalPrice, costPrice);
                                        }}
                                        disabled={isOutOfStock}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-black transition-colors z-10 ${isOutOfStock
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#1f7658] text-white hover:bg-[#123e30]'
                                            }`}
                                    >
                                        {isOutOfStock ? 'غير متاح' : 'شراء'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center bg-white border border-dashed border-[#cbd8cf] rounded-[20px] p-10 text-[#718078] font-medium">
                    عفواً، لا توجد باقات متاحة حالياً في هذا القسم.
                </div>
            )}

            {modalPlan && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#123e30]/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setModalPlan(null)}
                >
                    <div
                        className="bg-white rounded-[24px] w-full max-w-md h-[70vh] md:h-[480px] flex flex-col p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setModalPlan(null)}
                            className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center bg-[#f5f7f4] text-[#718078] rounded-full hover:bg-[#e6ece7] hover:text-[#123e30] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="pr-2 mb-4 shrink-0">
                            <span className="text-2xl mb-2 block">{parentProduct.icon}</span>
                            <h3 className="text-lg md:text-xl font-black text-[#123e30] leading-relaxed">
                                {modalPlan.name || modalPlan.title || 'تفاصيل الباقة'}
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-3 mb-6 visible-scrollbar">
                            <p className="text-xs md:text-sm text-[#53655b] leading-loose whitespace-pre-wrap">
                                {modalPlan.description || modalPlan.short_description || "لا توجد تفاصيل إضافية لهذه الباقة."}
                            </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#e6ece7] pt-4 shrink-0">
                            <div className="flex flex-col">
                                <p className="text-[10px] text-[#718078] font-bold mb-0.5">السعر</p>
                                <span className="text-xl md:text-2xl font-black text-[#1f7658] leading-none" dir="ltr">
                                    ${modalPlan.finalPrice.toFixed(2)}
                                </span>
                                {exchangeRate > 0 && (
                                    <span className="text-[11px] font-bold text-[#718078] mt-1.5" dir="rtl">
                                        ≈ {(modalPlan.finalPrice * exchangeRate).toFixed(2)} جنيه
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const isOutOfStock = checkOutOfStock(modalPlan);
                                    if (!isOutOfStock) {
                                        const { finalPrice, costPrice, ...planData } = modalPlan;
                                        setModalPlan(null);
                                        handleCheckout(planData, finalPrice, costPrice);
                                    }
                                }}
                                disabled={checkOutOfStock(modalPlan)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-colors ${checkOutOfStock(modalPlan)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#1f7658] text-white hover:bg-[#123e30] shadow-md'
                                    }`}
                            >
                                {checkOutOfStock(modalPlan) ? 'غير متاح حالياً' : 'متابعة الشراء'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}