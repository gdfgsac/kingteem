import { createContext, useState, useContext, useEffect } from 'react'

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

    // 3. جلب المنتجات 
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/reseller/products', {
                    method: 'GET',
                    headers: {
                        // هنا التعديل السحري: الكود سيقرأ المفتاح الجديد من إعدادات Vercel مباشرة
                        'X-API-Key': import.meta.env.VITE_VENDOR_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const items = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
                    setApiProducts(items);
                }
            } catch (error) {
                console.error("خطأ في جلب المنتجات:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
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
        <AppContext.Provider value={{ balance, setBalance, orders, addBalance, addOrder, apiProducts, isLoading }}>
            {children}
        </AppContext.Provider>
    )
}