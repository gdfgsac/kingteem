import { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const AppContext = createContext()

export const useAppContext = () => useContext(AppContext)

export const AppProvider = ({ children }) => {
    // 1. إدارة الرصيد مع الحفظ التلقائي
    const [balance, setBalance] = useState(() => {
        const savedBalance = localStorage.getItem('user_balance')
        return savedBalance ? parseFloat(savedBalance) : 0
    })

    useEffect(() => {
        localStorage.setItem('user_balance', balance.toString())
    }, [balance])

    // 2. إدارة الطلبات
    const [orders, setOrders] = useState(() => {
        const savedOrders = localStorage.getItem('user_orders')
        return savedOrders ? JSON.parse(savedOrders) : []
    })

    useEffect(() => {
        localStorage.setItem('user_orders', JSON.stringify(orders))
    }, [orders])

    const [apiProducts, setApiProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [exchangeRate, setExchangeRate] = useState(0)

    // 3. جلب المنتجات وسعر الصرف
    useEffect(() => {
        const fetchData = async () => {
            try {
                // أ. جلب المنتجات
                const response = await fetch('/api/reseller/products', {
                    method: 'GET',
                    headers: {
                        'X-API-Key': import.meta.env.VITE_VENDOR_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const items = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
                    setApiProducts(items);
                }

                // ب. جلب سعر الصرف من لوحة التحكم (الدفع اليدوي)
                const { data: rateData, error: rateError } = await supabase
                    .from('payment_settings')
                    .select('exchange_rate')
                    .eq('method_type', 'manual')
                    .limit(1) // هذا هو التعديل السحري الذي سيحل المشكلة
                    .maybeSingle();

                if (!rateError && rateData && rateData.exchange_rate) {
                    setExchangeRate(parseFloat(rateData.exchange_rate));
                }

            } catch (error) {
                console.error("خطأ في جلب البيانات:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [])

    const addBalance = (amount) => {
        setBalance(prev => prev + parseFloat(amount))
    }

    const addOrder = (product) => {
        const newOrder = {
            ...product,
            orderId: product.apiResponse?.order?.id || Math.random().toString(36).substring(2, 10).toUpperCase(),
            date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            status: product.apiResponse?.order?.status || 'مكتمل'
        }
        setOrders(prev => [newOrder, ...prev])
    }

    return (
        <AppContext.Provider value={{ balance, setBalance, orders, addBalance, addOrder, apiProducts, isLoading, exchangeRate }}>
            {children}
        </AppContext.Provider>
    )
}