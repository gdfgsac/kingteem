import { useState, useEffect } from 'react'

import Overview from './admin/Overview'
import PricingManager from './admin/PricingManager'
import UsersManager from './admin/UsersManager'
import OrdersManager from './admin/OrdersManager'
import PaymentSettings from './admin/PaymentSettings'
import PendingDeposits from './admin/PendingDeposits'

const tabs = [
    { id: 'overview', label: 'الإحصائيات', component: Overview },
    { id: 'pricing', label: 'التسعير', component: PricingManager },
    { id: 'users', label: 'المستخدمون', component: UsersManager },
    { id: 'orders', label: 'السجل', component: OrdersManager },
    { id: 'payments', label: 'الدفع', component: PaymentSettings },
    { id: 'pending', label: 'المعلقة', component: PendingDeposits },
]

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(() => {
        const hash = window.location.hash.replace('#', '')
        return tabs.some((t) => t.id === hash) ? hash : 'overview'
    })

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const changeTab = (id) => {
        setActiveTab(id)
        window.history.replaceState(null, '', `#${id}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const ActiveComponent = (tabs.find((t) => t.id === activeTab) || tabs[0]).component

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 pb-10 font-sans text-[#172820]" dir="rtl">
            <h1 className="text-lg sm:text-2xl font-black text-[#123e30] mb-3">لوحة الإدارة</h1>

            {/* الموبايل: 3 × 2 | الشاشات الأكبر: صف واحد ثابت */}
            <div className="md:sticky md:top-[65px] md:z-30 md:-mx-4 md:px-4 md:py-2 md:bg-[#f5f7f4]/95 md:backdrop-blur mb-4">
                <nav className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-white border border-[#e6ece7] p-1 rounded-2xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => changeTab(tab.id)}
                            className={`py-2.5 px-1 rounded-xl text-[13px] sm:text-sm font-black text-center transition-all truncate ${activeTab === tab.id
                                    ? 'bg-[#1f7658] text-white shadow-sm'
                                    : 'text-[#718078] hover:bg-[#f5f7f4] hover:text-[#123e30]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <ActiveComponent />
        </div>
    )
}