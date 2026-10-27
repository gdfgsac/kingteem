import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from './supabaseClient'

import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import WhatsAppButton from './components/WhatsAppButton' // استيراد زر الواتساب
import Home from './pages/Home'
import ProductDetails from './pages/ProductDetails'
import Checkout from './pages/Checkout'
import Deposit from './pages/Deposit'
import Orders from './pages/Orders'

import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function App() {
  const [session, setSession] = useState(null)
  const [balance, setBalance] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchBalance(session.user.id)
        checkAdmin(session.user.email)
      } else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchBalance(session.user.id)
        checkAdmin(session.user.email)
      } else {
        setBalance(0)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchBalance = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('balance').eq('id', userId).maybeSingle()
      if (data) setBalance(data.balance)
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAdmin = async (email) => {
    try {
      const { data } = await supabase.from('admins').select('email').eq('email', email).maybeSingle()
      setIsAdmin(!!data)
    } catch (error) {
      setIsAdmin(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f4]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1f7658]" />
      </div>
    )
  }

  const hideNavPages = ['/login', '/signup', '/forgot-password', '/reset-password']
  const shouldShowNav = !hideNavPages.includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f5f7f4]" dir="rtl">
      {shouldShowNav && <Navbar balance={balance} session={session} isAdmin={isAdmin} />}

      <main className="flex-grow pb-24 md:pb-8">
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          <Route path="/checkout/:id" element={session ? <Checkout user={session.user} setBalance={setBalance} /> : <Navigate to="/login" />} />
          <Route path="/deposit" element={session ? <Deposit user={session.user} setBalance={setBalance} /> : <Navigate to="/login" />} />
          <Route path="/orders" element={session ? <Orders user={session.user} /> : <Navigate to="/login" />} />

          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
        </Routes>
      </main>

      {session && shouldShowNav && <BottomNav isAdmin={isAdmin} />}
      <WhatsAppButton /> {/* زر الواتساب العائم */}
    </div>
  )
}

export default App