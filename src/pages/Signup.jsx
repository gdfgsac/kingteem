import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Signup() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleSignup = async (e) => {
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
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        setLoading(false)

        if (error) {
            const already = (error.message || '').toLowerCase().includes('already registered')
            setErrorMsg(already ? 'هذا البريد مسجل بالفعل.' : 'حدث خطأ أثناء التسجيل، حاول مجدداً.')
            return
        }

        // لو تأكيد الإيميل متفعّل في Supabase مش هيبقى فيه session
        if (!data.session) {
            setErrorMsg('تم إنشاء الحساب، تحقق من بريدك الإلكتروني لتأكيده ثم سجّل الدخول.')
            return
        }

        navigate('/', { replace: true })
    }

    const inputClass =
        'w-full bg-[#f9faf9] border border-[#e6ece7] rounded-xl py-3.5 pr-12 pl-4 font-medium focus:outline-none focus:border-[#1f7658] focus:ring-2 focus:ring-[#1f7658]/20 transition-all'

    return (
        <div className="min-h-screen bg-[#f5f7f4] flex items-center justify-center p-4 text-[#172820]" dir="rtl">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-[#e6ece7]">

                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#123e30] to-[#1f7658] flex items-center justify-center shadow-md">
                        <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
                            <path d="M16 11v26M16 24l14-13M16 24l14 13" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="35" cy="12" r="3.2" fill="#9be3c0" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-[#123e30] mb-1">Kings Store</h1>
                    <p className="text-[#718078] text-sm font-medium">إنشاء حساب جديد للانضمام إلينا.</p>
                </div>

                {errorMsg && (
                    <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="البريد الإلكتروني"
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="كلمة المرور"
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
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء الحساب'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm font-medium text-[#718078]">
                    لديك حساب بالفعل؟{' '}
                    <Link to="/login" className="text-[#1f7658] font-black hover:text-[#123e30]">
                        تسجيل الدخول
                    </Link>
                </p>
            </div>
        </div>
    )
}