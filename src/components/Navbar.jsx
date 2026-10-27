import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Wallet, History, Home, LogOut, LogIn, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Navbar({ balance = 0, session, isAdmin }) {
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <nav className="bg-white border-b border-[#e6ece7] sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">

                <div className="flex-1 flex justify-start">
                    <Link to="/" className="text-lg md:text-2xl font-black text-[#123e30] tracking-tight flex items-center gap-2">
                        <span className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gradient-to-br from-[#123e30] to-[#1c674b] rounded-xl shadow-md">
                            <svg viewBox="0 0 48 48" className="w-4 h-4 md:w-5 md:h-5" fill="none">
                                <path d="M16 11v26M16 24l14-13M16 24l14 13" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="35" cy="12" r="3.2" fill="#9be3c0" />
                            </svg>
                        </span>
                        Kings Store
                    </Link>
                </div>

                <div className="hidden md:flex flex-1 justify-center items-center gap-3">
                    {session && (
                        <>
                            <Link
                                to="/"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${location.pathname === '/' ? 'bg-[#d2e0d6] text-[#123e30]' : 'text-[#718078] hover:bg-[#f5f7f4]'}`}
                            >
                                <Home className="w-4 h-4" />
                                <span>الرئيسية</span>
                            </Link>

                            <Link
                                to="/orders"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${location.pathname === '/orders' ? 'bg-[#d2e0d6] text-[#123e30]' : 'text-[#718078] hover:bg-[#f5f7f4]'}`}
                            >
                                <History className="w-4 h-4" />
                                <span>السجل</span>
                            </Link>

                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${location.pathname === '/admin' ? 'bg-[#d2e0d6] text-[#123e30]' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>الإدارة</span>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                <div className="flex-1 flex justify-end items-center gap-2 md:gap-3">
                    {session ? (
                        <>
                            <div className="flex items-center bg-[#f5f7f4] border border-[#e6ece7] rounded-full p-1 pl-3 md:pl-4">
                                <span className="text-xs md:text-sm font-black text-[#123e30] ml-2 md:ml-3 flex items-center gap-1.5 md:gap-2">
                                    <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#718078]" />
                                    ${Number(balance).toFixed(2)}
                                </span>
                                <button
                                    onClick={() => navigate('/deposit')}
                                    className="bg-[#1f7658] text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center hover:bg-[#123e30] transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="text-[#718078] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                title="تسجيل الخروج"
                            >
                                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-2 bg-[#1f7658] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#123e30] transition-colors shadow-sm"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>دخول</span>
                        </Link>
                    )}
                </div>

            </div>
        </nav>
    )
}