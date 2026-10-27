import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // استلام بيانات العملية من الموقع
        const { txid, amount, method, userId } = await req.json()

        if (method !== 'binance' && method !== 'bybit') {
            return new Response(JSON.stringify({ error: 'وسيلة الدفع غير مدعومة.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
        }

        if (!userId) {
            return new Response(JSON.stringify({ error: 'معرف المستخدم مفقود.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
        }

        // 1. الاتصال بقاعدة البيانات وفحص التكرار لمنع الشحن المزدوج
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: existingTx } = await supabase
            .from('used_txids')
            .select('txid')
            .eq('txid', String(txid).trim())
            .single()

        if (existingTx) {
            return new Response(JSON.stringify({ error: 'رقم العملية (TXID) مستخدم من قبل.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
        }

        const expectedAmount = parseFloat(amount)

        // ==========================================
        //              بوابة BINANCE
        // ==========================================
        if (method === 'binance') {
            const apiKey = Deno.env.get('BINANCE_API_KEY')
            const secretKey = Deno.env.get('BINANCE_SECRET_KEY')
            const binancePayId = "415245456"

            if (!apiKey || !secretKey) throw new Error('مفاتيح بايننس غير متوفرة في الخادم.')

            const timestamp = Date.now().toString()
            const limit = "100"
            const queryString = `limit=${limit}&timestamp=${timestamp}`

            const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
            const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(queryString))
            const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

            const url = `https://api.binance.com/sapi/v1/pay/transactions?${queryString}&signature=${signature}`

            const binanceResponse = await fetch(url, { method: 'GET', headers: { 'X-MBX-APIKEY': apiKey } })
            const binanceData = await binanceResponse.json()

            if (binanceData.code && String(binanceData.code) !== "000000") {
                return new Response(JSON.stringify({ error: `خطأ بايننس: ${binanceData.msg}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
            }

            const transactions = binanceData.data || []
            const foundTx = transactions.find((tx: any) => String(tx.orderId) === String(txid).trim() || String(tx.transactionId) === String(txid).trim())

            if (foundTx) {
                const receiverId = String(foundTx.uid || "")
                if (receiverId !== binancePayId) return new Response(JSON.stringify({ error: 'المعاملة لم تُرسل لحساب المتجر الخاص بنا.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

                let actualAmount = parseFloat(foundTx.amount || "0")
                if (actualAmount === 0 && foundTx.fundsDetail && foundTx.fundsDetail.length > 0) {
                    actualAmount = parseFloat(foundTx.fundsDetail[0].amount || "0")
                }

                if (actualAmount < 0) return new Response(JSON.stringify({ error: 'هذه معاملة صادرة (مدفوعات)، وليست إيداعاً.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                if (actualAmount === 0) return new Response(JSON.stringify({ error: 'تعذر قراءة مبلغ العملية.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

                if (foundTx.status) {
                    const status = String(foundTx.status).toUpperCase()
                    if (!["SUCCESS", "COMPLETED", "PAID", "FINISHED"].includes(status)) return new Response(JSON.stringify({ error: `العملية غير مكتملة (الحالة: ${status}).` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                }

                const currency = String(foundTx.currency || (foundTx.fundsDetail && foundTx.fundsDetail[0]?.currency) || "").toUpperCase()
                if (currency !== "USDT") return new Response(JSON.stringify({ error: `نقبل USDT فقط. عملة العملية: ${currency}.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

                if (actualAmount < expectedAmount) return new Response(JSON.stringify({ error: `المبلغ المحول (${actualAmount}$) أقل من المطلوب (${expectedAmount}$).` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                if (actualAmount > expectedAmount) return new Response(JSON.stringify({ error: `المبلغ المكتوب (${expectedAmount}$) أقل من المحول (${actualAmount}$). يرجى كتابته بدقة.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

                // تسجيل المعاملة كـ "مستخدمة" لمنع التكرار
                const { error: insertError } = await supabase.from('used_txids').insert([{ txid: String(txid).trim() }])
                if (insertError) throw new Error('خطأ في قاعدة البيانات أثناء تسجيل المعاملة.')

                // تحديث رصيد المستخدم
                const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single()
                const currentBalance = parseFloat(profile?.balance || "0")
                await supabase.from('profiles').update({ balance: currentBalance + expectedAmount }).eq('id', userId)

                // ==== الإضافة الجديدة: تسجيل الإيداع في سجل لوحة الإدارة ====
                await supabase.from('transactions').insert([{
                    user_id: userId,
                    type: 'deposit',
                    amount: expectedAmount,
                    title: 'إيداع عبر Binance Pay'
                }])

                return new Response(JSON.stringify({ success: true, message: 'تم التحقق وشحن الرصيد بنجاح عبر بايننس.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
            } else {
                return new Response(JSON.stringify({ error: 'العملية غير موجودة في بايننس، تأكد من الرقم.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
            }
        }

        // ==========================================
        //               بوابة BYBIT
        // ==========================================
        if (method === 'bybit') {
            const apiKey = Deno.env.get('BYBIT_API_KEY')
            const secretKey = Deno.env.get('BYBIT_SECRET_KEY')

            if (!apiKey || !secretKey) throw new Error('مفاتيح بايبت غير متوفرة في الخادم.')

            const timestamp = Date.now().toString()
            const recvWindow = "5000"
            const paramStr = "limit=50"
            const signPayload = timestamp + apiKey + recvWindow + paramStr

            const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
            const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signPayload))
            const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

            const url = `https://api.bybit.com/v5/asset/deposit/query-internal-record?${paramStr}`
            const bybitResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow
                }
            })
            const bybitData = await bybitResponse.json()

            if (bybitData.retCode !== 0) {
                return new Response(JSON.stringify({ error: `خطأ بايبت: ${bybitData.retMsg}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
            }

            const transactions = bybitData.result?.rows || bybitData.result?.list || []
            const foundTx = transactions.find((tx: any) => String(tx.txID).trim() === String(txid).trim() || String(tx.id).trim() === String(txid).trim())

            if (foundTx) {
                // فحص الحالة
                const status = String(foundTx.status)
                if (!["1", "2", "SUCCESS"].includes(status)) {
                    return new Response(JSON.stringify({ error: 'المعاملة موجودة ولكن لم تكتمل بعد.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                }

                // فحص العملة
                const currency = String(foundTx.coin || "").toUpperCase()
                if (currency !== "USDT") {
                    return new Response(JSON.stringify({ error: `نقبل USDT فقط. عملة العملية: ${currency}.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                }

                // فحص وتطابق المبلغ
                const actualAmount = parseFloat(foundTx.amount || "0")

                if (actualAmount < expectedAmount) return new Response(JSON.stringify({ error: `المبلغ المحول (${actualAmount}$) أقل من المطلوب (${expectedAmount}$).` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                if (actualAmount > expectedAmount) return new Response(JSON.stringify({ error: `المبلغ المكتوب (${expectedAmount}$) أقل من المحول (${actualAmount}$). يرجى كتابته بدقة.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

                // تسجيل المعاملة في قاعدة البيانات كـ "مستخدمة"
                const { error: insertError } = await supabase.from('used_txids').insert([{ txid: String(txid).trim() }])
                if (insertError) throw new Error('خطأ في قاعدة البيانات أثناء تسجيل المعاملة.')

                // تحديث رصيد المستخدم
                const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single()
                const currentBalance = parseFloat(profile?.balance || "0")
                await supabase.from('profiles').update({ balance: currentBalance + expectedAmount }).eq('id', userId)

                // ==== الإضافة الجديدة: تسجيل الإيداع في سجل لوحة الإدارة ====
                await supabase.from('transactions').insert([{
                    user_id: userId,
                    type: 'deposit',
                    amount: expectedAmount,
                    title: 'إيداع عبر Bybit'
                }])

                return new Response(JSON.stringify({ success: true, message: 'تم التحقق وشحن الرصيد بنجاح عبر بايبت.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

            } else {
                return new Response(JSON.stringify({ error: 'العملية غير موجودة في بايبت، تأكد من الرقم.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
            }
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
})