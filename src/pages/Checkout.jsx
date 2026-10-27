import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Loader2, AlertCircle, ShoppingBag, Copy, Check } from 'lucide-react'

// في حال عدم توفر السعر النهائي المرسل، هذه الدالة الاحتياطية تحسب التكلفة الأساسية
const extractPrice = (plan) => {
    let price = 0;
    if (plan?.price_tiers && Array.isArray(plan.price_tiers) && plan.price_tiers.length > 0) {
        price = plan.price_tiers[0].price_usd ?? plan.price_tiers[0].price ?? 0;
    } else {
        price = plan?.price_usd ?? plan?.price ?? 0;
    }
    return parseFloat(price) || 0;
}

export default function Checkout({ user, setBalance }) {
    const { state } = useLocation()
    const navigate = useNavigate()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const [orderResult, setOrderResult] = useState(null)
    const [isCopied, setIsCopied] = useState(false)

    // استقبال بيانات المنتج والسعر النهائي والتكلفة
    const planData = state?.planData
    const parentIcon = state?.parentIcon || '📦'

    // استلام الأسعار (النهائي للخصم، والتكلفة لحساب الأرباح)
    const finalPrice = state?.finalPrice
    const costPrice = state?.costPrice

    useEffect(() => {
        window.scrollTo(0, 0)
        if (!planData) {
            navigate('/')
        }
    }, [planData, navigate])

    if (!planData) return null

    // نعتمد على السعر النهائي المحسوب بصفحة المنتجات، ولو مش موجود نسحب السعر الأصلي
    const planPrice = finalPrice !== undefined ? finalPrice : extractPrice(planData)
    const originalCost = costPrice !== undefined ? costPrice : extractPrice(planData)

    const planName = planData.name || planData.title || 'باقة غير معروفة'

    const handlePurchase = async () => {
        if (!user || !user.id) {
            setErrorMsg('حدث خطأ في الجلسة، يرجى تسجيل الدخول مجدداً.')
            return
        }

        setErrorMsg('')
        setIsSubmitting(true)

        try {
            const response = await fetch('https://zojwkdaiezebrpdobhwb.supabase.co/functions/v1/process-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvandrZGFpZXplYnJwZG9iaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzk4NTIsImV4cCI6MjEwODYxNTg1Mn0.Z9WnGMOmcxQdObdGNvwhBxO3_8-1IQKmzl2Ofn_U_bM`
                },
                body: JSON.stringify({
                    userId: user.id,
                    productId: planData.id,
                    productTitle: planName,
                    price: planPrice,        // المبلغ اللي العميل هيدفعه (شامل ربحك)
                    costPrice: originalCost  // تكلفة المنتج الحقيقية (عشان السيرفر يحسب الربح الصافي ويسجله)
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'فشلت عملية الشراء. تأكد من توفر رصيد كافٍ.')
            }

            if (setBalance) setBalance(data.newBalance)

            setOrderResult(data.apiResponse)
            setIsSuccess(true)

        } catch (err) {
            setErrorMsg(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getDeliveryText = (res) => {
        if (!res) return 'جاري جلب البيانات...';
        if (res.order?.items && Array.isArray(res.order.items) && res.order.items.length > 0) {
            const itemsData = res.order.items.map(item => item.account_data || item.code || item.url || JSON.stringify(item)).join('\n\n');
            if (itemsData) return itemsData;
        }
        if (res.delivery) return typeof res.delivery === 'object' ? JSON.stringify(res.delivery, null, 2) : res.delivery;
        if (res.order?.delivery) return typeof res.order.delivery === 'object' ? JSON.stringify(res.order.delivery, null, 2) : res.order.delivery;
        if (res.data?.delivery) return typeof res.data.delivery === 'object' ? JSON.stringify(res.data.delivery, null, 2) : res.data.delivery;

        const temp = { ...res };
        delete temp.success; delete temp.balance_after; delete temp.total; delete temp.unit_price; delete temp.idempotent; delete temp.status; delete temp.message;

        const keys = Object.keys(temp);
        if (keys.length === 0) return 'الطلب قيد التنفيذ (جاري إصدار المنتج)...';
        if (keys.length === 1 && typeof temp[keys[0]] === 'string') return temp[keys[0]];
        return JSON.stringify(temp, null, 2).replace(/["{}]/g, '').trim();
    }

    const displayDelivery = getDeliveryText(orderResult);

    const handleCopy = () => {
        navigator.clipboard.writeText(displayDelivery)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-lg font-sans text-[#172820]">
            {!isSuccess && (
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#718078] hover:text-[#123e30] transition-colors mb-6 bg-white px-4 py-2 rounded-full border border-[#e6ece7] w-fit"
                >
                    <ArrowRight className="w-4 h-4" /> رجوع
                </button>
            )}

            <div className="bg-white p-6 rounded-[24px] border border-[#e6ece7] shadow-sm relative overflow-hidden">
                {isSuccess ? (
                    <div className="py-2 animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-[#eff5ef] rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-8 h-8 text-[#1f7658]" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-[#123e30]">تم تنفيذ طلبك بنجاح.</h2>
                        </div>

                        <div className="bg-[#f5f7f4] border border-[#e6ece7] rounded-2xl p-5 mb-8 space-y-4">
                            <div>
                                <span className="block text-sm font-bold text-[#718078] mb-1">المنتج:</span>
                                <span className="block font-black text-[#172820] text-lg">{planName}</span>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="block text-sm font-bold text-[#718078]">بيانات التسليم:</span>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1 text-xs font-bold text-[#1f7658] hover:text-[#123e30] transition-colors bg-[#eff5ef] px-2 py-1 rounded-md border border-[#d2e0d6]"
                                    >
                                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {isCopied ? 'تم النسخ' : 'نسخ'}
                                    </button>
                                </div>
                                <div className="bg-white border border-[#d2e0d6] rounded-xl p-3 text-[#123e30] font-bold text-sm whitespace-pre-wrap break-words select-all max-h-[200px] overflow-y-auto">
                                    {displayDelivery}
                                </div>
                            </div>

                            <div className="border-t border-[#e6ece7] pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#718078]">المبلغ المدفوع:</span>
                                    {/* السعر النهائي بيظهر للعميل */}
                                    <span className="font-black text-[#172820]" dir="ltr">${Number(planPrice).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/orders')}
                                className="w-full bg-[#1f7658] text-white hover:bg-[#123e30] py-3.5 rounded-xl text-sm font-black transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" /> عرض سجل العمليات
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-white border border-[#e6ece7] text-[#123e30] hover:bg-[#f5f7f4] py-3.5 rounded-xl text-sm font-black transition-all"
                            >
                                العودة للرئيسية
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl md:text-2xl font-black text-[#123e30] mb-6 border-b border-[#f5f7f4] pb-4">تأكيد الشراء</h1>

                        <div className="flex items-center gap-4 mb-8 bg-[#f5f7f4] p-4 rounded-2xl border border-[#e6ece7]">
                            <div className="text-4xl">{parentIcon}</div>
                            <div className="flex-1">
                                <h3 className="font-black text-[#172820] text-lg leading-tight mb-1">{planName}</h3>
                                {/* السعر النهائي بيظهر للعميل في التأكيد */}
                                <p className="text-[#1f7658] font-black text-xl" dir="ltr">${planPrice.toFixed(2)}</p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p>{errorMsg}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePurchase}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl text-base font-black transition-all flex items-center justify-center gap-2 ${isSubmitting
                                ? 'bg-[#cbd8cf] text-[#53655b] cursor-not-allowed'
                                : 'bg-[#1f7658] text-white hover:bg-[#123e30] shadow-md'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري الدفع وتنفيذ الطلب...
                                </>
                            ) : (
                                'إتمام الشراء الآن'
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}