import { Link, useLocation } from 'react-router-dom'
import { Home, Wallet, History, ShieldCheck } from 'lucide-react'

export default function BottomNav({ isAdmin }) {
    const location = useLocation()

    // الروابط الأساسية لكل المستخدمين
    const navItems = [
        { path: '/', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
        { path: '/deposit', label: 'المحفظة', icon: <Wallet className="w-5 h-5" /> },
        { path: '/orders', label: 'السجل', icon: <History className="w-5 h-5" /> }
    ]

    // لو المستخدم أدمن، نضيف زرار الإدارة للقائمة السفلية
    if (isAdmin) {
        navItems.push({ path: '/admin', label: 'الإدارة', icon: <ShieldCheck className="w-5 h-5" /> })
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ece7] px-6 py-1.5 z-50">
            <div className="flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    const isAdminBtn = item.path === '/admin'

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center gap-1 min-w-[48px] py-1"
                        >
                            <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200 ${isActive
                                    ? (isAdminBtn ? 'bg-red-50 text-red-600' : 'bg-[#d2e0d6] text-[#123e30]')
                                    : 'text-[#718078] bg-transparent'
                                }`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] font-black transition-colors ${isActive
                                    ? (isAdminBtn ? 'text-red-600' : 'text-[#123e30]')
                                    : 'text-[#718078]'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}