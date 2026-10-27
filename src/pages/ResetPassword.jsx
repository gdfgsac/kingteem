import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [done, setDone] = useState(false)

    // تنظيف المؤقت لو المستخدم خرج من الصفحة قبل التحويل
    useEffect(() => {
        if (!done) return
        const t = setTimeout(() => navigate('/'), 3000)
        return () => clearTimeout(t)
    }, [done, navigate])

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (password.length < 6) {
            setErrorMsg('كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.')
            return
        }
        if (password !== confirmPassword) {
            setErrorMsg('كلمتا المرور غير متطابقتين.')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (error) {
            setErrorMsg('حدث خطأ، قد يكون الرابط منتهي الصلاحية أو غير صالح.')
            return
        }
        setDone(true)
    }

    const inputClass =
        'w-full bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-3.5 pr-12 pl-4 font-medium focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/20 transition-all'

    return (
        <div className="min-h-screen bg-[#f5f7f4] flex items-center justify-center p-4 text-[#172820]" dir="rtl">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-[#e6ece7]">

                {done ? (
                    <div className="text-center py-2">
                        <div className="w-16 h-16 bg-[#eaf5ef] rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-[#1f7658]" />
                        </div>
                        <h2 className="text-xl font-black text-[#123e30] mb-2">تم التحديث بنجاح!</h2>
                        <p className="text-[#718078] text-sm">جاري تحويلك للمتجر...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#123e30] to-[#1f7658] flex items-center justify-center shadow-md">
                                <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
                                    <path d="M16 11v26M16 24l14-13M16 24l14 13" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="35" cy="12" r="3.2" fill="#9be3c0" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black text-[#123e30] mb-1">تعيين كلمة مرور جديدة</h1>
                            <p className="text-[#718078] text-sm font-medium">أدخل كلمة المرور الجديدة لحسابك.</p>
                        </div>

                        {errorMsg && (
                            <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{errorMsg}</p>
                            </div>
                        )}

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
                                <input
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="كلمة المرور الجديدة"
                                    className={inputClass}
                                    dir="ltr"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
                                <input
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="تأكيد كلمة المرور"
                                    className={inputClass}
                                    dir="ltr"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-black text-white bg-[#1f7658] hover:bg-[#123e30] disabled:bg-[#cbd8cf] disabled:text-[#53655b] disabled:cursor-not-allowed transition-all flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ كلمة المرور'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}