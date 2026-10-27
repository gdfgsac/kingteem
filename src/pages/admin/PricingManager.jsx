import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAppContext } from '../../context/AppContext'

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`

const inputClass =
    'w-full bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-3 px-4 font-black text-center focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/15 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed'

// السعر النهائي = التكلفة × المضاعف (لو موجود) + الربح الثابت
const calcPrice = (cost, multiplier, fixed) => (multiplier > 0 ? cost * multiplier : cost) + fixed

export default function PricingManager() {
    const { apiProducts, isLoading: productsLoading } = useAppContext()

    const [globalRule, setGlobalRule] = useState({ margin_percentage: '', fixed_markup: '' })
    const [productRules, setProductRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingGlobal, setSavingGlobal] = useState(false)
    const [savedMsg, setSavedMsg] = useState(false)

    const [newRule, setNewRule] = useState({ target_id: '', margin_percentage: '', fixed_markup: '' })
    const [addingRule, setAddingRule] = useState(false)

    useEffect(() => {
        loadRules()
    }, [])

    const loadRules = async () => {
        const { data } = await supabase.from('pricing_rules').select('*').order('created_at', { ascending: false })
        if (data) {
            const global = data.find((r) => r.target_type === 'global')
            if (global) {
                setGlobalRule({
                    margin_percentage: global.margin_percentage || '',
                    fixed_markup: global.fixed_markup || '',
                })
            }
            setProductRules(data.filter((r) => r.target_type === 'product'))
        }
        setLoading(false)
    }

    const saveGlobalRule = async () => {
        setSavingGlobal(true)
        const margin = parseFloat(globalRule.margin_percentage) || 0
        // لو في مضاعف، الربح الثابت بيتصفّر عشان ما يتضافش بدون ما تشوفه
        const fixed = margin > 0 ? 0 : parseFloat(globalRule.fixed_markup) || 0

        const { data: existing } = await supabase
            .from('pricing_rules')
            .select('id')
            .eq('target_type', 'global')
            .maybeSingle()

        if (existing) {
            await supabase.from('pricing_rules').update({ margin_percentage: margin, fixed_markup: fixed }).eq('id', existing.id)
        } else {
            await supabase.from('pricing_rules').insert([{ target_type: 'global', margin_percentage: margin, fixed_markup: fixed }])
        }

        setSavingGlobal(false)
        setSavedMsg(true)
        setTimeout(() => setSavedMsg(false), 2500)
    }

    const handleAddProductRule = async (e) => {
        e.preventDefault()
        if (!newRule.target_id) return

        setAddingRule(true)
        const margin = parseFloat(newRule.margin_percentage) || 0
        const fixed = parseFloat(newRule.fixed_markup) || 0
        const existingRule = productRules.find((r) => String(r.target_id) === String(newRule.target_id))

        if (existingRule) {
            await supabase.from('pricing_rules').update({ margin_percentage: margin, fixed_markup: fixed }).eq('id', existingRule.id)
            await loadRules()
        } else {
            const { data } = await supabase
                .from('pricing_rules')
                .insert([{ target_type: 'product', target_id: newRule.target_id, margin_percentage: margin, fixed_markup: fixed }])
                .select()
            if (data) setProductRules([data[0], ...productRules])
        }

        setNewRule({ target_id: '', margin_percentage: '', fixed_markup: '' })
        setAddingRule(false)
    }

    const deleteRule = async (id) => {
        if (!window.confirm('حذف التسعير المخصص؟ سيعود المنتج للتسعير العام.')) return
        await supabase.from('pricing_rules').delete().eq('id', id)
        setProductRules(productRules.filter((r) => r.id !== id))
    }

    const getProductDetails = (targetId) => {
        const product = apiProducts.find((p) => String(p.id) === String(targetId))
        if (!product) return null

        const tier = Array.isArray(product.price_tiers) && product.price_tiers.length > 0 ? product.price_tiers[0] : null
        const price = tier ? tier.price_usd ?? tier.price ?? 0 : product.price_usd ?? product.price ?? 0
        return { name: product.name || product.title, cost: parseFloat(price) || 0 }
    }

    if (loading || productsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1f7658]" />
            </div>
        )
    }

    const hasMultiplier = parseFloat(globalRule.margin_percentage) > 0

    return (
        <div className="space-y-5">

            {/* التسعير العام */}
            <section className="bg-white border border-[#e6ece7] rounded-2xl p-5 md:p-6">
                <h2 className="font-black text-[#123e30]">التسعير العام</h2>
                <p className="text-sm font-medium text-[#718078] mt-1 mb-5">
                    يُطبَّق على كل الباقات التي ليس لها تسعير مخصص.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-[#718078] mb-1.5">مضاعف السعر (2 = ضعف التكلفة)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="2"
                            value={globalRule.margin_percentage}
                            onChange={(e) => setGlobalRule({ ...globalRule, margin_percentage: e.target.value })}
                            className={inputClass}
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#718078] mb-1.5">أو ربح ثابت ($)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="2.5"
                            value={hasMultiplier ? '' : globalRule.fixed_markup}
                            disabled={hasMultiplier}
                            onChange={(e) => setGlobalRule({ ...globalRule, fixed_markup: e.target.value })}
                            className={inputClass}
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-5">
                    {savedMsg && <span className="text-sm font-bold text-[#1f7658]">تم الحفظ ✓</span>}
                    <button
                        onClick={saveGlobalRule}
                        disabled={savingGlobal}
                        className="bg-[#1f7658] hover:bg-[#123e30] disabled:bg-[#cbd8cf] text-white px-8 py-3 rounded-xl font-black transition-all min-w-[120px] flex justify-center"
                    >
                        {savingGlobal ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
                    </button>
                </div>
            </section>

            {/* التسعير المخصص */}
            <section className="bg-white border border-[#e6ece7] rounded-2xl p-5 md:p-6">
                <h2 className="font-black text-[#123e30]">تسعير مخصص لباقة</h2>
                <p className="text-sm font-medium text-[#718078] mt-1 mb-5">
                    يتجاهل التسعير العام للباقة المختارة فقط.
                </p>

                <form onSubmit={handleAddProductRule} className="space-y-3">
                    <select
                        required
                        value={newRule.target_id}
                        onChange={(e) => setNewRule({ ...newRule, target_id: e.target.value })}
                        className="w-full bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/15 cursor-pointer"
                    >
                        <option value="" disabled>اختر الباقة</option>
                        {apiProducts.map((p) => (
                            <option key={p.id} value={p.id}>{p.name || p.title}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="مضاعف (x)"
                            value={newRule.margin_percentage}
                            onChange={(e) => setNewRule({ ...newRule, margin_percentage: e.target.value })}
                            className={inputClass}
                            dir="ltr"
                        />
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="ربح ثابت ($)"
                            value={newRule.fixed_markup}
                            onChange={(e) => setNewRule({ ...newRule, fixed_markup: e.target.value })}
                            className={inputClass}
                            dir="ltr"
                        />
                        <button
                            type="submit"
                            disabled={addingRule}
                            className="col-span-2 sm:col-span-1 bg-[#123e30] hover:bg-[#172820] disabled:bg-[#cbd8cf] text-white px-8 py-3 rounded-xl font-black transition-all flex justify-center items-center"
                        >
                            {addingRule ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إضافة'}
                        </button>
                    </div>
                </form>

                {/* القائمة */}
                {productRules.length === 0 ? (
                    <p className="mt-6 py-8 text-center text-sm font-bold text-[#9aa9a0] border border-dashed border-[#cbd8cf] rounded-xl">
                        لا توجد استثناءات، كل الباقات بالتسعير العام.
                    </p>
                ) : (
                    <ul className="mt-6 divide-y divide-[#eef2ef] border border-[#e6ece7] rounded-xl overflow-hidden">
                        {productRules.map((rule) => {
                            const details = getProductDetails(rule.target_id)

                            if (!details) {
                                return (
                                    <li key={rule.id} className="px-4 py-3 flex items-center justify-between gap-3 bg-red-50/60">
                                        <span className="text-sm font-bold text-red-500">منتج غير متوفر (ID: {rule.target_id})</span>
                                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                )
                            }

                            const multiplier = parseFloat(rule.margin_percentage) || 0
                            const fixed = parseFloat(rule.fixed_markup) || 0
                            const newPrice = calcPrice(details.cost, multiplier, fixed)
                            const label = [multiplier > 0 && `x${multiplier}`, fixed > 0 && `+$${fixed}`].filter(Boolean).join(' ')

                            return (
                                <li key={rule.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-[#f9faf9] transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm truncate">{details.name}</p>
                                        <p className="text-xs font-bold text-[#9aa9a0] mt-0.5" dir="ltr" style={{ textAlign: 'right' }}>
                                            {money(details.cost)} {label && `· ${label}`}
                                        </p>
                                    </div>
                                    <span className="font-black text-[#1f7658] bg-[#eaf5ef] px-3 py-1.5 rounded-lg text-sm" dir="ltr">
                                        {money(newPrice)}
                                    </span>
                                    <button
                                        onClick={() => deleteRule(rule.id)}
                                        className="p-1.5 text-[#9aa9a0] hover:text-red-500 transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </div>
    )
}