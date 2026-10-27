import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        // هنا استقبلنا السعر النهائي (price) والتكلفة الأصلية (costPrice)
        const { userId, productId, productTitle, price, costPrice } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. جلب رصيد المستخدم
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single()

        const currentBalanceInCents = Math.round(parseFloat(profile?.balance || "0") * 100)
        const productPriceInCents = Math.round(parseFloat(price) * 100)

        // 2. التأكد من توفر الرصيد بناءً على السعر النهائي
        if (currentBalanceInCents < productPriceInCents) {
            return new Response(JSON.stringify({ error: 'رصيدك غير كافٍ لإتمام عملية الشراء. يرجى شحن المحفظة.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
        }

        // 3. الاتصال بمزود الخدمة
        const idempotencyKey = crypto.randomUUID()
        const vendorApiKey = Deno.env.get('VENDOR_API_KEY') ?? ''
        const vendorUrl = 'https://web-production-1c7b1.up.railway.app/api/reseller/orders'

        const vendorResponse = await fetch(vendorUrl, {
            method: 'POST',
            headers: {
                'X-API-Key': vendorApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1,
                idempotency_key: idempotencyKey
            })
        })

        const vendorData = await vendorResponse.json()

        if (!vendorResponse.ok) {
            throw new Error(vendorData.message || vendorData.error || 'عذراً، المنتج غير متوفر لدى المزود حالياً.')
        }

        // 4. خصم الرصيد
        const newBalance = (currentBalanceInCents - productPriceInCents) / 100
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)

        // ==========================================
        // 5. حساب الأرباح الصافية وتسجيل الطلب
        // ==========================================
        const actualCost = parseFloat(costPrice || price)
        const actualPrice = parseFloat(price)
        const netProfit = actualPrice - actualCost

        // أ- تسجيل العملية في جدول (orders) الخاص بلوحة الإدارة (شامل الأرباح)
        await supabase.from('orders').insert([{
            user_id: userId,
            product_name: productTitle,
            price: actualPrice,
            cost_price: actualCost, // التكلفة
            net_profit: netProfit,  // صافي الربح
            status: 'مكتمل',
            api_response: vendorData
        }])

        // ب- تسجيل العملية في جدول (transactions) الخاص بسجل العميل
        await supabase.from('transactions').insert([{
            user_id: userId,
            type: 'purchase',
            amount: actualPrice,
            title: `شراء: ${productTitle}`,
            api_response: vendorData
        }])

        return new Response(JSON.stringify({ success: true, newBalance, apiResponse: vendorData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
})