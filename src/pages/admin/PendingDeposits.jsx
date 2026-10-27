import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`
const ltr = { direction: 'ltr', textAlign: 'right' }

const formatDate = (d) =>
    new Date(d).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function PendingDeposits() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')
    const [actionError, setActionError] = useState('')
    const [processingId, setProcessingId] = useState(null)
    const [modalImage, setModalImage] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                const { data, error } = await supabase
                    .from('pending_deposits')
                    .select('*, profiles(email, balance), payment_settings(name)')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })

                if (error) throw error
                setRequests(data || [])
            } catch (err) {
                console.error('Fetch Pending Deposits Error:', err)
                setErrorMsg(`خطأ في جلب البيانات: ${err.message}`)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const removeRequest = (id) => setRequests((prev) => prev.filter((r) => r.id !== id))

    const handleApprove = async (req) => {
        if (!window.confirm('تأكيد استلام المبلغ وإضافة الرصيد للعميل؟')) return
        setProcessingId(req.id)
        setActionError('')

        try {
            // 1. تحديث حالة الطلب
            const { error: updateError } = await supabase
                .from('pending_deposits')
                .update({ status: 'approved' })
                .eq('id', req.id)
            if (updateError) throw updateError

            // 2. إضافة الرصيد للعميل
            const newBalance = parseFloat(req.profiles?.balance || 0) + parseFloat(req.amount)
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', req.user_id)
            if (balanceError) throw balanceError

            // 3. تسجيل العملية
            await supabase.from('transactions').insert([
                {
                    user_id: req.user_id,
                    amount: req.amount,
                    type: 'deposit',
                    title: `إيداع يدوي عبر ${req.payment_settings?.name || 'محفظة'}`,
                },
            ])

            removeRequest(req.id)
        } catch (error) {
            setActionError(`حدث خطأ أثناء الموافقة: ${error.message}`)
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id) => {
        if (!window.confirm('هل أنت متأكد من رفض هذا الطلب؟')) return
        setProcessingId(id)
        setActionError('')

        try {
            const { error } = await supabase.from('pending_deposits').update({ status: 'rejected' }).eq('id', id)
            if (error) throw error
            removeRequest(id)
        } catch (error) {
            setActionError(`حدث خطأ أثناء الرفض: ${error.message}`)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1f7658]" />
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="bg-white border border-[#e6ece7] rounded-2xl overflow-hidden">

                {/* العنوان */}
                <div className="p-5 md:p-6 border-b border-[#e6ece7] flex items-start justify-between gap-3">
                    <div>
                        <h2 className="font-black text-[#123e30]">الطلبات المعلقة</h2>
                        <p className="text-sm font-medium text-[#718078] mt-1">
                            راجع إثبات الدفع ثم وافق لإضافة الرصيد للعميل.
                        </p>
                    </div>
                    {requests.length > 0 && (
                        <span className="shrink-0 bg-[#eaf5ef] text-[#1f7658] text-sm font-black px-3 py-1 rounded-lg">
                            {requests.length}
                        </span>
                    )}
                </div>

                {actionError && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-red-600">{actionError}</span>
                        <button onClick={() => setActionError('')} className="text-xs font-black text-red-500 hover:text-red-700 shrink-0">
                            إخفاء
                        </button>
                    </div>
                )}

                {/* القائمة */}
                {errorMsg ? (
                    <div className="py-14 text-center">
                        <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-red-600">{errorMsg}</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-14 text-center">
                        <CheckCircle className="w-10 h-10 text-[#cbd8cf] mx-auto mb-3" />
                        <p className="text-sm font-bold text-[#718078]">لا توجد طلبات معلقة حالياً.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[#eef2ef]">
                        {requests.map((req) => {
                            const busy = processingId === req.id

                            return (
                                <li
                                    key={req.id}
                                    className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#f9faf9] transition-colors"
                                >
                                    {/* البيانات */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-lg text-[#1f7658]" dir="ltr">
                                                +{money(req.amount)}
                                            </span>
                                            <span className="text-xs font-bold bg-[#eaf5ef] text-[#123e30] px-2 py-0.5 rounded-md">
                                                {req.payment_settings?.name || 'تحويل'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-[#172820] mt-1 truncate" style={ltr}>
                                            {req.profiles?.email || 'إيميل غير معروف'}
                                        </p>

                                        {/* التعديل الجديد لإبراز رقم العملية / المحول منه */}
                                        <div className="mt-2 mb-1.5 bg-[#eff5ef] border border-[#d2e0d6] px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-[#718078]">الرقم المحوَّل منه / العملية:</span>
                                            <span className="text-sm font-black text-[#123e30]" dir="ltr">{req.txid || '—'}</span>
                                        </div>

                                        <p className="text-[11px] font-bold text-[#9aa9a0]">
                                            {formatDate(req.created_at)}
                                        </p>
                                    </div>

                                    {/* الإجراءات */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {req.receipt_image && (
                                            <button
                                                onClick={() => setModalImage(req.receipt_image)}
                                                disabled={busy}
                                                className="flex items-center gap-1.5 text-sm font-black text-[#1f7658] bg-[#eaf5ef] hover:bg-[#d2e0d6] disabled:opacity-50 px-3 py-2.5 rounded-xl transition-colors"
                                            >
                                                <ImageIcon className="w-4 h-4" /> الإثبات
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleApprove(req)}
                                            disabled={busy}
                                            className="flex-1 md:flex-none bg-[#1f7658] hover:bg-[#123e30] disabled:bg-[#cbd8cf] text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all min-w-[96px] flex justify-center items-center gap-1.5"
                                        >
                                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> موافقة</>}
                                        </button>

                                        <button
                                            onClick={() => handleReject(req.id)}
                                            disabled={busy}
                                            className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-black transition-colors"
                                        >
                                            رفض
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            {/* نافذة عرض الإثبات */}
            {modalImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#123e30]/80 backdrop-blur-sm"
                    onClick={() => setModalImage(null)}
                >
                    <div className="bg-white p-2 rounded-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        <img src={modalImage} alt="إثبات الدفع" className="w-full max-h-[80vh] object-contain rounded-xl" />
                        <button
                            onClick={() => setModalImage(null)}
                            className="w-full mt-2 bg-[#f5f7f4] hover:bg-[#e6ece7] text-[#123e30] py-3 rounded-xl font-black transition-colors"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}