import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

// حذف "(IPA)" من الأسماء والعناوين
const clean = (s) => (s || '').replace(/\s*\(\s*IPA\s*\)/gi, '').trim()

const inputClass =
    'w-full bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-3 px-4 font-black text-center focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/15 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed'

export default function PaymentSettings() {
    const [methods, setMethods] = useState([])
    const [rate, setRate] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savedMsg, setSavedMsg] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('payment_settings').select('*').order('id')
            if (data) {
                setMethods(data)
                const manual = data.find((m) => m.method_type === 'manual')
                if (manual) setRate(manual.exchange_rate || '')
            }
            setLoading(false)
        }
        load()
    }, [])

    const update = (id, field, value) =>
        setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)))

    const save = async () => {
        setSaving(true)
        setError('')
        const numericRate = parseFloat(rate) || 0

        const results = await Promise.all(
            methods.map((m) =>
                supabase
                    .from('payment_settings')
                    .update({
                        account_id: m.account_id,
                        is_active: m.is_active,
                        exchange_rate: m.method_type === 'manual' ? numericRate : 0,
                    })
                    .eq('id', m.id)
            )
        )

        setSaving(false)

        if (results.some((r) => r.error)) {
            setError('تعذر حفظ بعض التعديلات، حاول مرة أخرى.')
            return
        }

        setSavedMsg(true)
        setTimeout(() => setSavedMsg(false), 2500)
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

            {/* سعر الدولار */}
            <section className="bg-white border border-[#e6ece7] rounded-2xl p-5 md:p-6">
                <h2 className="font-black text-[#123e30]">سعر الدولار</h2>
                <p className="text-sm font-medium text-[#718078] mt-1 mb-5">
                    يُطبَّق على المحافظ المحلية فقط.
                </p>

                <div className="relative max-w-xs">
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="57"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className={inputClass}
                        dir="ltr"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#9aa9a0] pointer-events-none">
                        EGP
                    </span>
                </div>
            </section>

            {/* وسائل الدفع */}
            <section className="bg-white border border-[#e6ece7] rounded-2xl p-5 md:p-6">
                <h2 className="font-black text-[#123e30]">وسائل الدفع</h2>
                <p className="text-sm font-medium text-[#718078] mt-1 mb-5">
                    التعديل يظهر فوراً في صفحة الشحن.
                </p>

                {methods.length === 0 ? (
                    <p className="py-8 text-center text-sm font-bold text-[#9aa9a0] border border-dashed border-[#cbd8cf] rounded-xl">
                        لا توجد وسائل دفع.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {methods.map((m) => (
                            <div key={m.id} className="border border-[#e6ece7] rounded-xl p-4">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <span className={`font-black truncate ${m.is_active ? 'text-[#123e30]' : 'text-[#9aa9a0]'}`}>
                                        {clean(m.name)}
                                    </span>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={m.is_active}
                                        aria-label={clean(m.name)}
                                        onClick={() => update(m.id, 'is_active', !m.is_active)}
                                        dir="ltr"
                                        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${m.is_active ? 'bg-[#1f7658]' : 'bg-[#cbd8cf]'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${m.is_active ? 'translate-x-5' : ''
                                                }`}
                                        />
                                    </button>
                                </div>

                                <label className="block text-xs font-bold text-[#718078] mb-1.5">
                                    {clean(m.account_label)}
                                </label>
                                <input
                                    type="text"
                                    value={m.account_id || ''}
                                    onChange={(e) => update(m.id, 'account_id', e.target.value)}
                                    disabled={!m.is_active}
                                    className={inputClass}
                                    dir="ltr"
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 mt-5">
                    {error && <span className="text-sm font-bold text-red-500">{error}</span>}
                    {savedMsg && <span className="text-sm font-bold text-[#1f7658]">تم الحفظ ✓</span>}
                    <button
                        onClick={save}
                        disabled={saving}
                        className="bg-[#1f7658] hover:bg-[#123e30] disabled:bg-[#cbd8cf] text-white px-8 py-3 rounded-xl font-black transition-all min-w-[120px] flex justify-center"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
                    </button>
                </div>
            </section>
        </div>
    )
}