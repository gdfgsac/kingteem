import { useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, Loader2, History, X, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Orders({ user }) {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    // حالات للتحكم في النافذة المنبثقة ونسخ النص
    const [selectedTx, setSelectedTx] = useState(null)
    const [isCopied, setIsCopied] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
        if (user) fetchTransactions()
    }, [user])

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }) // الأحدث أولاً

            if (!error && data) {
                setTransactions(data)
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    // نفس الدالة الخاصة بفك تشفير بيانات التسليم الموجودة في صفحة الشراء
    const getDeliveryText = (res) => {
        if (!res) return 'لا توجد بيانات تسليم مسجلة لهذه العملية.';

        if (res.order?.items && Array.isArray(res.order.items) && res.order.items.length > 0) {
            const itemsData = res.order.items.map(item => item.account_data || item.code || item.url || JSON.stringify(item)).join('\n\n');
            if (itemsData) return itemsData;
        }

        if (res.delivery) return typeof res.delivery === 'object' ? JSON.stringify(res.delivery, null, 2) : res.delivery;
        if (res.order?.delivery) return typeof res.order.delivery === 'object' ? JSON.stringify(res.order.delivery, null, 2) : res.order.delivery;
        if (res.data?.delivery) return typeof res.data.delivery === 'object' ? JSON.stringify(res.data.delivery, null, 2) : res.data.delivery;

        const temp = { ...res };
        delete temp.success;
        delete temp.balance_after;
        delete temp.total;
        delete temp.unit_price;
        delete temp.idempotent;
        delete temp.status;
        delete temp.message;

        const keys = Object.keys(temp);
        if (keys.length === 0) return 'الطلب قيد التنفيذ (جاري إصدار المنتج)...';
        if (keys.length === 1 && typeof temp[keys[0]] === 'string') return temp[keys[0]];
        return JSON.stringify(temp, null, 2).replace(/["{}]/g, '').trim();
    }

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#1f7658]" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl font-sans text-[#172820]">
            {/* الهيدر بعد التعديل ليكون بسيطاً ويحتوي على كلمة السجل فقط */}
            <div className="flex items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#eff5ef] rounded-xl flex items-center justify-center">
                        <History className="w-6 h-6 text-[#1f7658]" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#123e30]">السجل</h1>
                    </div>
                </div>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-white border border-dashed border-[#cbd8cf] rounded-[24px] p-10 text-center">
                    <History className="w-12 h-12 text-[#cbd8cf] mx-auto mb-4" />
                    <h3 className="text-lg font-black text-[#123e30] mb-2">لا توجد عمليات بعد</h3>
                    <p className="text-[#718078] text-sm font-medium mb-6">لم تقم بأي عمليات إيداع أو شراء حتى الآن.</p>
                    <Link to="/deposit" className="inline-flex items-center gap-2 bg-[#1f7658] text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-[#123e30] transition-colors shadow-sm">
                        شحن المحفظة الآن
                    </Link>
                </div>
            ) : (
                <div className="bg-white border border-[#e6ece7] rounded-[24px] shadow-sm overflow-hidden">
                    <div className="divide-y divide-[#e6ece7]">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                /* تفعيل الضغط فقط على المشتريات لفتح التفاصيل */
                                onClick={() => tx.type === 'purchase' && setSelectedTx(tx)}
                                className={`p-4 md:p-5 flex items-center justify-between transition-colors ${tx.type === 'purchase' ? 'cursor-pointer hover:bg-[#f9faf9]' : 'hover:bg-[#f9faf9]'}`}
                            >
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                                        }`}>
                                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#172820] text-sm md:text-base mb-1">{tx.title}</h4>
                                        <p className="text-xs text-[#718078] font-medium" dir="ltr">
                                            {new Date(tx.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left shrink-0">
                                    <span className={`font-black text-sm md:text-lg block mb-0.5 ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                        }`} dir="ltr">
                                        {tx.type === 'deposit' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* النافذة المنبثقة (Modal) لعرض تفاصيل الطلب */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTx(null)}>
                    <div
                        className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()} // عشان لو ضغط جوا النافذة متقفلش
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-[#123e30]">تفاصيل الطلب</h2>
                                <button onClick={() => setSelectedTx(null)} className="p-2 bg-[#f5f7f4] rounded-full text-[#718078] hover:text-red-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-[#f5f7f4] border border-[#e6ece7] rounded-2xl p-5 space-y-4">
                                <div>
                                    <span className="block text-sm font-bold text-[#718078] mb-1">المنتج:</span>
                                    <span className="block font-black text-[#172820] text-lg">{selectedTx.title.replace('شراء: ', '')}</span>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="block text-sm font-bold text-[#718078]">بيانات التسليم:</span>
                                        <button
                                            onClick={() => handleCopy(getDeliveryText(selectedTx.api_response))}
                                            className="flex items-center gap-1 text-xs font-bold text-[#1f7658] hover:text-[#123e30] transition-colors bg-[#eff5ef] px-2 py-1 rounded-md border border-[#d2e0d6]"
                                        >
                                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {isCopied ? 'تم النسخ' : 'نسخ'}
                                        </button>
                                    </div>
                                    <div className="bg-white border border-[#d2e0d6] rounded-xl p-3 text-[#123e30] font-bold text-sm whitespace-pre-wrap break-words select-all max-h-[200px] overflow-y-auto">
                                        {getDeliveryText(selectedTx.api_response)}
                                    </div>
                                </div>

                                <div className="border-t border-[#e6ece7] pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[#718078]">المبلغ المدفوع:</span>
                                        <span className="font-black text-[#172820]" dir="ltr">${parseFloat(selectedTx.amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}