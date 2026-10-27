import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        setLoading(false)
        if (error) {
            setErrorMsg('بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.')
            return
        }
        navigate('/')
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
                    <p className="text-[#718078] text-sm font-medium">مرحباً بعودتك! يرجى تسجيل الدخول.</p>
                </div>

                {errorMsg && (
                    <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
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
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="كلمة المرور"
                            className={inputClass}
                            dir="ltr"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm font-bold text-[#1f7658] hover:text-[#123e30]">
                            نسيت كلمة المرور؟
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-black text-white bg-[#1f7658] hover:bg-[#123e30] disabled:bg-[#cbd8cf] disabled:text-[#53655b] disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm font-medium text-[#718078]">
                    ليس لديك حساب؟{' '}
                    <Link to="/signup" className="text-[#1f7658] font-black hover:text-[#123e30]">
                        إنشاء حساب جديد
                    </Link>
                </p>
            </div>
        </div>
    )
}