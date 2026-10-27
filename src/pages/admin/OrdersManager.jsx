import { useState, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`
const ltr = { direction: 'ltr', textAlign: 'right' }

const formatDate = (d) =>
    new Date(d).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// دالة لمعرفة اسم العميل أو الـ ID كبديل
const who = (row) => row.profiles?.email || (row.user_id ? row.user_id.substring(0, 8) + '...' : '—')

export default function OrdersManager() {
    const [tab, setTab] = useState('sales')
    const [sales, setSales] = useState([])
    const [deposits, setDeposits] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                // جلب المبيعات (مع الإيميل)
                const salesPromise = supabase
                    .from('orders')
                    .select('*, profiles(email)')
                    .order('created_at', { ascending: false })
                    .limit(100)

                // جلب الإيداعات (بدون profiles لتجنب خطأ الربط في قاعدة البيانات)
                const depositsPromise = supabase
                    .from('transactions')
                    .select('*')
                    .eq('type', 'deposit')
                    .order('created_at', { ascending: false })
                    .limit(100)

                const [{ data: s }, { data: d }] = await Promise.all([salesPromise, depositsPromise])

                setSales(s || [])
                setDeposits(d || [])
            } catch (error) {
                console.error('Error fetching history:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const totals = useMemo(() => {
        const sum = (arr, key) => arr.reduce((t, r) => t + parseFloat(r[key] || 0), 0)
        return {
            profit: sum(sales, 'net_profit'),
            revenue: sum(sales, 'price'),
            deposits: sum(deposits, 'amount'),
        }
    }, [sales, deposits])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1f7658]" />
            </div>
        )
    }

    const isSales = tab === 'sales'
    const rows = isSales ? sales : deposits

    return (
        <div className="space-y-5">
            <h2 className="text-xl md:text-2xl font-black text-[#123e30]">سجل العمليات</h2>

            {/* الملخص */}
            <div className="bg-gradient-to-br from-[#123e30] to-[#1c674b] rounded-2xl p-6 text-white">
                <p className="text-sm font-bold text-white/70 mb-1">
                    {isSales ? 'صافي الأرباح' : 'إجمالي الإيداعات'}
                </p>
                <p className="text-4xl font-black" style={ltr}>
                    {money(isSales ? totals.profit : totals.deposits)}
                </p>
                <p className="text-xs font-bold text-white/60 mt-3">
                    {isSales
                        ? `${sales.length} عملية بيع · مبيعات ${money(totals.revenue)}`
                        : `${deposits.length} عملية إيداع`}
                    {' · آخر 100 عملية'}
                </p>
            </div>

            <div className="bg-white border border-[#e6ece7] rounded-2xl overflow-hidden">

                {/* التبويبات */}
                <div className="p-3 border-b border-[#e6ece7]">
                    <div className="grid grid-cols-2 gap-1 bg-[#f5f7f4] p-1 rounded-xl">
                        {[
                            { id: 'sales', label: 'المبيعات' },
                            { id: 'deposits', label: 'الإيداعات' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`py-2.5 rounded-lg text-sm font-black transition-all ${tab === t.id
                                    ? 'bg-white text-[#123e30] shadow-sm'
                                    : 'text-[#718078] hover:text-[#123e30]'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* القائمة */}
                {rows.length === 0 ? (
                    <p className="py-14 text-center text-sm font-bold text-[#718078]">
                        {isSales ? 'لا توجد مبيعات حتى الآن.' : 'لا توجد إيداعات حتى الآن.'}
                    </p>
                ) : (
                    <ul className="divide-y divide-[#eef2ef] max-h-[600px] overflow-y-auto">
                        {rows.map((row) => (
                            <li key={row.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#f9faf9] transition-colors">
                                <div className="min-w-0">
                                    <p className="font-black text-[#172820] truncate">
                                        {isSales ? row.product_name || 'منتج غير معروف' : row.title || 'إيداع رصيد'}
                                    </p>
                                    <p className="text-xs font-bold text-[#9aa9a0] mt-1 truncate" style={ltr}>
                                        {who(row)}
                                    </p>
                                </div>

                                <div className="text-left shrink-0">
                                    {/* السعر الرئيسي أو الإيداع */}
                                    <p className="font-black text-[#172820]" dir="ltr">
                                        {isSales ? money(row.price) : '+' + money(row.amount)}
                                    </p>

                                    <p className="text-xs font-bold text-[#9aa9a0] mt-1">
                                        {/* إظهار الربح الصافي بشكل واضح لو كان بيع */}
                                        {isSales && (
                                            <span className="text-[#1f7658] ml-2" dir="ltr">
                                                ربح: {money(row.net_profit)}
                                            </span>
                                        )}
                                        {formatDate(row.created_at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}