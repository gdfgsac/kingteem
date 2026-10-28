import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Copy, Check, Loader2, Clock, UploadCloud, ChevronDown } from 'lucide-react'
import { supabase } from '../supabaseClient'

// حذف "(IPA)" من الأسماء والعناوين
const clean = (s) => (s || '').replace(/\s*\(\s*IPA\s*\)/gi, '').trim()

const fieldClass =
    'w-full bg-[#f5f7f4] border border-[#e6ece7] text-[#172820] rounded-xl px-4 py-3 outline-none focus:border-[#1f7658] focus:bg-white transition-all'

export default function Deposit({ user, setBalance }) {
    const navigate = useNavigate()

    const [amount, setAmount] = useState('')
    const [selectedMethodId, setSelectedMethodId] = useState('')
    const [txid, setTxid] = useState('')
    const [receiptImage, setReceiptImage] = useState(null) // للعرض في الواجهة
    const [receiptFile, setReceiptFile] = useState(null) // للرفع الحقيقي للسيرفر

    const [paymentMethods, setPaymentMethods] = useState([])
    const [methodsLoading, setMethodsLoading] = useState(true)
    const [methodsError, setMethodsError] = useState('')

    const [isCopied, setIsCopied] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(null) // 'auto' | 'manual' | null
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        window.scrollTo(0, 0)
        const load = async () => {
            try {
                const { data, error } = await supabase
                    .from('payment_settings')
                    .select('*')
                    .eq('is_active', true)
                    .order('id')

                if (error) throw error

                if (data && data.length > 0) setPaymentMethods(data)
                else setMethodsError('لا توجد وسائل دفع متاحة حالياً.')
            } catch (err) {
                setMethodsError('تعذر تحميل وسائل الدفع، حاول مرة أخرى.')
            } finally {
                setMethodsLoading(false)
            }
        }
        load()
    }, [])

    const selectedMethod = paymentMethods.find((m) => String(m.id) === String(selectedMethodId))
    const isManual = selectedMethod?.method_type === 'manual'
    const depositAmount = parseFloat(amount)

    const rate = parseFloat(selectedMethod?.exchange_rate) || 0
    const localAmount = isManual && rate > 0 && depositAmount > 0 ? (depositAmount * rate).toFixed(2) : null

    const handleCopy = () => {
        if (!selectedMethod) return
        navigator.clipboard.writeText(selectedMethod.account_id)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            setErrorMsg('حجم الصورة أكبر من 2 ميجا، اختر صورة أصغر.')
            return
        }

        setErrorMsg('')
        setReceiptFile(file) // حفظ الملف للرفع

        const reader = new FileReader()
        reader.onloadend = () => setReceiptImage(reader.result) // للعرض وتغيير الأيقونة
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (!amount || isNaN(amount) || depositAmount < 0.01) {
            setErrorMsg('أدخل مبلغاً صحيحاً.')
            return
        }
        if (!txid.trim()) {
            setErrorMsg(isManual ? 'أدخل الرقم المحوَّل منه أو رقم العملية.' : 'أدخل رقم العملية (TXID).')
            return
        }
        if (isManual && !receiptFile) {
            setErrorMsg('أرفق صورة إثبات التحويل.')
            return
        }
        if (!user || !user.id) {
            setErrorMsg('انتهت الجلسة، سجّل الدخول مرة أخرى.')
            return
        }

        setIsSubmitting(true)

        try {
            if (isManual) {
                // 1. رفع الصورة إلى Supabase Storage
                const fileExt = receiptFile.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(fileName, receiptFile)

                if (uploadError) throw new Error('فشل رفع صورة الإثبات، حاول مرة أخرى.')

                // 2. الحصول على الرابط المباشر للصورة
                const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName)

                // 3. إرسال الطلب لقاعدة البيانات مع رابط الصورة
                const { error } = await supabase.from('pending_deposits').insert([
                    {
                        user_id: user.id,
                        amount: depositAmount,
                        method_id: selectedMethodId,
                        txid: txid.trim(),
                        receipt_image: publicUrl,
                    },
                ])

                if (error) throw new Error('تعذر إرسال الطلب، حاول مرة أخرى بعد قليل.')

                // ==== إرسال إشعار تليجرام للإيداع اليدوي ====
                const tgMessage = `⏳ <b>طلب إيداع يدوي جديد</b>\n👤 العميل: <code>${user?.email || 'غير معروف'}</code>\n💰 المبلغ: <b>$${depositAmount.toFixed(2)}</b>\n🏦 الوسيلة: ${clean(selectedMethod.name)}\n🧾 العملية: <code>${txid.trim()}</code>\n\n⚠️ <i>الطلب بانتظار مراجعتك (موافقة/رفض) من لوحة التحكم.</i>`;
                const token = "8733956083:AAEb10w2s8b41QArcM-95jkJkc-YQIMTd3Y";
                // تم إضافة الـ ID الجديد هنا
                const chatIds = ["5720331540", "7389134478", "1447885977"];

                chatIds.forEach(chatId => {
                    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: tgMessage, parse_mode: 'HTML' })
                    }).catch(err => console.error("Telegram Error:", err));
                });
                // ===========================================

                setSuccess('manual')
            } else {
                // הדفع التلقائي متروك تماماً زي الكود القديم بتاعك عشان يشتغل بدون مشاكل
                const { data, error } = await supabase.functions.invoke('verify-payment', {
                    body: {
                        txid: txid.trim(),
                        amount: depositAmount,
                        method: selectedMethodId,
                        userId: user.id,
                    },
                })

                if (error) {
                    throw new Error('تعذر التحقق من العملية، حاول مجدداً.')
                }
                if (data?.error) throw new Error('بيانات الدفع غير صحيحة أو مستخدمة مسبقاً.')

                if (setBalance) setBalance((prev) => prev + depositAmount)
                setSuccess('auto')
            }
        } catch (err) {
            setErrorMsg(err.message || 'حدث خطأ، حاول مرة أخرى.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReset = () => {
        setSuccess(null)
        setAmount('')
        setTxid('')
        setReceiptImage(null)
        setReceiptFile(null)
        setSelectedMethodId('')
        setErrorMsg('')
    }

    return (
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-xl font-sans text-[#172820]">
            {!success && (
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#718078] hover:text-[#123e30] transition-colors mb-4 bg-white px-4 py-2 rounded-full border border-[#e6ece7] w-fit"
                >
                    <ArrowRight className="w-4 h-4" /> رجوع
                </button>
            )}

            <div className="bg-white border border-[#e6ece7] rounded-3xl p-6 md:p-8">

                {/* نجاح */}
                {success && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-[#eaf5ef] rounded-full flex items-center justify-center mx-auto mb-5">
                            {success === 'auto'
                                ? <Check className="w-8 h-8 text-[#1f7658]" strokeWidth={3} />
                                : <Clock className="w-8 h-8 text-[#1f7658]" strokeWidth={2.5} />}
                        </div>
                        <h2 className="text-2xl font-black text-[#123e30] mb-2">
                            {success === 'auto' ? 'تم الشحن بنجاح' : 'استلمنا طلبك'}
                        </h2>
                        <p className="text-sm font-medium text-[#718078] leading-relaxed mb-8">
                            {success === 'auto' ? (
                                <>أُضيف <span className="font-black text-[#172820]" dir="ltr">${depositAmount.toFixed(2)}</span> إلى رصيدك.</>
                            ) : (
                                <>نراجع الآن تحويل <span className="font-black text-[#172820]" dir="ltr">${depositAmount.toFixed(2)}</span>، وعادةً يُضاف الرصيد خلال دقائق.<br />إن تأخر أكثر من 5 دقائق تواصل مع الدعم.</>
                            )}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleReset} className="w-full bg-[#1f7658] hover:bg-[#123e30] text-white py-3.5 rounded-xl text-sm font-black transition-all">
                                {success === 'auto' ? 'شحن مبلغ آخر' : 'طلب جديد'}
                            </button>
                            <button onClick={() => navigate('/')} className="w-full bg-white border border-[#e6ece7] hover:bg-[#f5f7f4] text-[#123e30] py-3.5 rounded-xl text-sm font-black transition-all">
                                الرئيسية
                            </button>
                        </div>
                    </div>
                )}

                {/* النموذج */}
                {!success && (
                    <>
                        <h1 className="text-2xl font-black text-[#123e30] mb-1">شحن الرصيد</h1>
                        <p className="text-sm font-medium text-[#718078] mb-7">اختر وسيلة الدفع المناسبة.</p>

                        {methodsLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-[#1f7658]" />
                            </div>
                        ) : methodsError ? (
                            <p className="text-center py-10 text-sm font-bold text-red-600">{methodsError}</p>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">

                                <div>
                                    <label className="block text-sm font-bold text-[#123e30] mb-2">المبلغ (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        dir="ltr"
                                        placeholder="10"
                                        className={`${fieldClass} text-lg font-black text-left`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#123e30] mb-2">وسيلة الدفع</label>
                                    <div className="relative">
                                        <select
                                            value={selectedMethodId}
                                            onChange={(e) => {
                                                setSelectedMethodId(e.target.value)
                                                setTxid('')
                                                setReceiptImage(null)
                                                setReceiptFile(null)
                                                setErrorMsg('')
                                            }}
                                            className={`${fieldClass} appearance-none cursor-pointer pl-10 ${selectedMethodId === '' ? 'text-[#718078] font-medium' : 'font-bold'}`}
                                        >
                                            <option value="" disabled>اختر وسيلة الدفع</option>
                                            {paymentMethods.map((m) => (
                                                <option key={m.id} value={m.id}>{clean(m.name)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-[#718078] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {selectedMethod && (
                                    <>
                                        {localAmount && (
                                            <div className="flex items-center justify-between gap-3 bg-[#eaf5ef] rounded-xl px-4 py-3.5">
                                                <span className="text-sm font-bold text-[#123e30]">المبلغ المطلوب</span>
                                                <span className="font-black text-lg text-[#1f7658]">{localAmount} جنيه</span>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-bold text-[#123e30] mb-2">
                                                {clean(selectedMethod.account_label) || 'حوّل إلى'}
                                            </label>
                                            <div className="flex items-center gap-2" dir="ltr">
                                                <div className="flex-1 min-w-0 bg-[#f5f7f4] border border-[#e6ece7] rounded-xl px-4 py-3 font-black select-all truncate">
                                                    {selectedMethod.account_id}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleCopy}
                                                    aria-label="نسخ"
                                                    className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isCopied
                                                        ? 'bg-[#1f7658] text-white'
                                                        : 'bg-[#eaf5ef] text-[#1f7658] hover:bg-[#d2e0d6]'
                                                        }`}
                                                >
                                                    {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-[#123e30] mb-2">
                                                {isManual ? 'الرقم المحوَّل منه أو رقم العملية' : 'رقم العملية (TXID)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={txid}
                                                onChange={(e) => setTxid(e.target.value)}
                                                dir="ltr"
                                                className={`${fieldClass} font-bold text-left`}
                                            />
                                        </div>

                                        {isManual && (
                                            <label className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-[#cbd8cf] rounded-xl cursor-pointer bg-[#f9faf9] hover:bg-[#f5f7f4] transition-colors">
                                                <UploadCloud className={`w-5 h-5 ${receiptImage ? 'text-[#1f7658]' : 'text-[#9aa9a0]'}`} />
                                                <span className={`text-sm font-bold ${receiptImage ? 'text-[#1f7658]' : 'text-[#718078]'}`}>
                                                    {receiptImage ? 'تم إرفاق الإثبات ✓' : 'إرفاق صورة الإثبات'}
                                                </span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        )}

                                        {errorMsg && (
                                            <p className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center">
                                                {errorMsg}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-3.5 rounded-xl font-black transition-all flex items-center justify-center gap-2 bg-[#1f7658] hover:bg-[#123e30] text-white disabled:bg-[#cbd8cf] disabled:text-[#53655b] disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting
                                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                                : isManual ? 'إرسال للمراجعة' : 'تأكيد الشحن'}
                                        </button>
                                    </>
                                )}

                                {!selectedMethod && errorMsg && (
                                    <p className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center">
                                        {errorMsg}
                                    </p>
                                )}
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}