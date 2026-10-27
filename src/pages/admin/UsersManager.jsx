import { useState, useEffect } from 'react'
import { Search, Loader2, Trash2, X } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`
const ltr = { direction: 'ltr', textAlign: 'right' }

export default function UsersManager() {
    const [currentUserEmail, setCurrentUserEmail] = useState('')

    // البحث
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)

    // تعديل الرصيد
    const [editId, setEditId] = useState(null)
    const [editBalance, setEditBalance] = useState('')
    const [saving, setSaving] = useState(false)

    // سجل العميل (النافذة المنبثقة)
    const [activeUser, setActiveUser] = useState(null)
    const [orders, setOrders] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)

    // المشرفين
    const [adminsList, setAdminsList] = useState([])
    const [newAdminEmail, setNewAdminEmail] = useState('')
    const [addingAdmin, setAddingAdmin] = useState(false)
    const [adminError, setAdminError] = useState('')

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) setCurrentUserEmail(session.user.email)

            const { data: admins } = await supabase.from('admins').select('email')
            setAdminsList(admins || [])
        }
        load()
    }, [])

    // بحث من السيرفر (أول 8 نتائج)
    useEffect(() => {
        const q = searchTerm.trim()
        if (!q) {
            setResults([])
            setSearching(false)
            return
        }
        setSearching(true)
        const t = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, email, balance')
                .ilike('email', `%${q}%`)
                .limit(8)
            setResults(data || [])
            setSearching(false)
        }, 300)
        return () => clearTimeout(t)
    }, [searchTerm])

    const startEdit = (user) => {
        setEditId(user.id)
        setEditBalance(String(user.balance ?? 0))
    }

    const saveBalance = async (user) => {
        const value = parseFloat(editBalance)
        if (Number.isNaN(value) || value < 0) return

        setSaving(true)
        const { error } = await supabase.from('profiles').update({ balance: value }).eq('id', user.id)
        setSaving(false)

        if (!error) {
            setResults((r) => r.map((u) => (u.id === user.id ? { ...u, balance: value } : u)))
            setEditId(null)
        }
    }

    // فتح سجل العميل
    const openHistory = async (user) => {
        setActiveUser(user)
        setOrders([])
        setHistoryLoading(true)
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)
        setOrders(data || [])
        setHistoryLoading(false)
    }

    const addAdmin = async (e) => {
        e.preventDefault()
        setAddingAdmin(true)
        setAdminError('')
        const email = newAdminEmail.trim()
        const { error } = await supabase.from('admins').insert([{ email }])
        setAddingAdmin(false)

        if (error) {
            setAdminError('تعذر الإضافة، قد يكون المشرف موجوداً بالفعل.')
            return
        }
        setAdminsList([...adminsList, { email }])
        setNewAdminEmail('')
    }

    const removeAdmin = async (email) => {
        if (!window.confirm(`إزالة صلاحية الإشراف عن ${email}؟`)) return
        const { error } = await supabase.from('admins').delete().eq('email', email)
        if (!error) setAdminsList(adminsList.filter((a) => a.email !== email))
    }

    return (
        <div className="space-y-5 relative">

            {/* العملاء والأرصدة */}
            <section className="bg-white border border-[#e6ece7] rounded-2xl p-5 md:p-6">
                <h2 className="font-black text-[#123e30] mb-4">العملاء والأرصدة</h2>

                <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
                    <input
                        type="text"
                        placeholder="ابحث عن عميل بالبريد الإلكتروني"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-3 pr-12 pl-4 font-medium focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/15 transition-all"
                    />
                </div>

                {searchTerm.trim() && (
                    <div className="mt-3 divide-y divide-[#eef2ef]">
                        {searching ? (
                            <p className="py-6 text-center text-sm text-[#718078]">جاري البحث...</p>
                        ) : results.length === 0 ? (
                            <p className="py-6 text-center text-sm font-bold text-[#718078]">لا توجد نتائج.</p>
                        ) : (
                            results.map((u) => (
                                <div key={u.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <span className="flex-1 min-w-[180px] truncate font-bold text-sm" style={ltr}>
                                        {u.email}
                                    </span>

                                    {editId === u.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                autoFocus
                                                value={editBalance}
                                                onChange={(e) => setEditBalance(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveBalance(u)
                                                    if (e.key === 'Escape') setEditId(null)
                                                }}
                                                className="w-24 px-3 py-1.5 border border-[#cbd8cf] rounded-lg text-center font-black focus:outline-none focus:border-[#1f7658]"
                                                dir="ltr"
                                            />
                                            <button
                                                onClick={() => saveBalance(u)}
                                                disabled={saving}
                                                className="bg-[#1f7658] hover:bg-[#123e30] text-white px-4 py-1.5 rounded-lg text-sm font-black min-w-[64px] flex justify-center"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
                                            </button>
                                            <button onClick={() => setEditId(null)} className="text-[#718078] hover:text-red-500 text-sm font-bold">
                                                إلغاء
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-[#1f7658] text-sm ml-1" dir="ltr">{money(u.balance)}</span>
                                            <button
                                                onClick={() => openHistory(u)}
                                                className="text-sm font-bold text-[#123e30] bg-[#f5f7f4] hover:bg-[#e6ece7] px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                السجل
                                            </button>
                                            <button
                                                onClick={() => startEdit(u)}
                                                className="text-sm font-black text-[#1f7658] bg-[#eaf5ef] hover:bg-[#d2e0d6] px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                تعديل
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* المشرفون */}
            <section className="bg-white border border-[#e6ece7] rounded-2xl p-5 md:p-6">
                <h2 className="font-black text-[#123e30] mb-4">المشرفون</h2>

                <form onSubmit={addAdmin} className="flex gap-2">
                    <input
                        type="email"
                        required
                        placeholder="بريد مشرف جديد"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="flex-1 min-w-0 bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-2.5 px-4 text-sm font-medium focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/15 transition-all"
                        dir="ltr"
                    />
                    <button
                        type="submit"
                        disabled={addingAdmin}
                        className="px-6 rounded-xl font-black text-white bg-[#1f7658] hover:bg-[#123e30] disabled:bg-[#cbd8cf] transition-all flex items-center justify-center"
                    >
                        {addingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة'}
                    </button>
                </form>
                {adminError && <p className="text-xs font-bold text-red-600 mt-2">{adminError}</p>}

                <ul className="mt-4 divide-y divide-[#eef2ef]">
                    {adminsList.map((a) => (
                        <li key={a.email} className="py-2.5 flex items-center gap-3">
                            <span className="flex-1 min-w-0 truncate text-sm font-bold" style={ltr}>{a.email}</span>
                            {a.email === currentUserEmail ? (
                                <span className="text-xs font-bold text-[#718078]">أنت</span>
                            ) : (
                                <button
                                    onClick={() => removeAdmin(a.email)}
                                    className="p-1.5 text-[#9aa9a0] hover:text-red-600 transition-colors"
                                    title="إزالة"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* نافذة سجل العميل (Modal) */}
            {activeUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172820]/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setActiveUser(null)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 flex items-start justify-between gap-3 border-b border-[#e6ece7]">
                            <div className="min-w-0">
                                <p className="text-sm font-black text-[#123e30] truncate" style={ltr}>{activeUser.email}</p>
                                <p className="text-xs font-bold text-[#718078] mt-1">
                                    الرصيد: <span className="text-[#1f7658]" dir="ltr">{money(activeUser.balance)}</span>
                                </p>
                            </div>
                            <button onClick={() => setActiveUser(null)} className="text-[#718078] hover:text-red-500 bg-[#f5f7f4] p-1.5 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[360px] overflow-y-auto">
                            {historyLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#1f7658]" />
                                </div>
                            ) : orders.length === 0 ? (
                                <p className="py-10 text-center text-sm font-bold text-[#718078]">لا توجد عمليات شراء سابقة للعميل.</p>
                            ) : (
                                <ul className="divide-y divide-[#eef2ef]">
                                    {orders.map((o, i) => (
                                        <li key={o.id || i} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-[#f9faf9] transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate text-[#172820]">{o.product_name || o.title || 'طلب شراء'}</p>
                                                <p className="text-xs font-bold text-[#9aa9a0] mt-0.5" dir="ltr" style={{ textAlign: 'right' }}>
                                                    {new Date(o.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="text-left shrink-0">
                                                <span className="font-black text-[#172820] text-sm block" dir="ltr">
                                                    {money(o.price ?? o.amount)}
                                                </span>
                                                {o.net_profit !== undefined && (
                                                    <span className="text-[10px] font-bold text-[#1f7658]" dir="ltr">
                                                        ربح: {money(o.net_profit)}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}