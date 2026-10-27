import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`
const ltr = { direction: 'ltr', textAlign: 'right' }
const sum = (arr, key) => (arr || []).reduce((t, r) => t + parseFloat(r[key] || 0), 0)

export default function Overview() {
    const [stats, setStats] = useState({ users: 0, balance: 0, sales: 0, profit: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [{ count }, { data: balances }, { data: orders }] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('balance'),
                    supabase.from('orders').select('price, net_profit'),
                ])

                setStats({
                    users: count || 0,
                    balance: sum(balances, 'balance'),
                    sales: sum(orders, 'price'),
                    profit: sum(orders, 'net_profit'),
                })
            } catch (error) {
                console.error('Error loading stats:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1f7658]" />
            </div>
        )
    }

    const margin = stats.sales > 0 ? Math.round((stats.profit / stats.sales) * 100) : 0

    const items = [
        { label: 'إجمالي المبيعات', value: money(stats.sales), dir: true },
        { label: 'أرصدة العملاء', value: money(stats.balance), dir: true },
        { label: 'المستخدمون', value: stats.users },
    ]

    return (
        <div className="space-y-4">
            {/* الأرباح */}
            <div className="bg-gradient-to-br from-[#123e30] to-[#1c674b] rounded-2xl p-6 md:p-8 text-white">
                <p className="text-sm font-bold text-white/70 mb-2">صافي الأرباح</p>
                <p className="text-4xl md:text-5xl font-black text-[#d7e77a]" style={ltr}>
                    {money(stats.profit)}
                </p>
                <p className="text-xs font-bold text-white/60 mt-4">هامش الربح {margin}%</p>
            </div>

            {/* باقي الأرقام */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item.label} className="bg-white border border-[#e6ece7] rounded-2xl p-5">
                        <p className="text-sm font-bold text-[#718078] mb-1">{item.label}</p>
                        <p className="text-2xl font-black text-[#123e30]" style={item.dir ? ltr : undefined}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}