import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { triggerPusherEvent } from '@/lib/pusherTrigger'
import { NewJobRequest, NewJobResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: NewJobRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { shopSlug, serviceCode, filename, fileUrl, fileType, pages, copies, isColor, isDuplex, totalAmount, paymentMethod } = body

  if (!shopSlug || !serviceCode || !fileUrl || !totalAmount) {
    return NextResponse.json({ error: 'Missing required job fields' }, { status: 400 })
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id, upi_vpa, shop_name, is_online')
    .eq('slug', shopSlug)
    .single()

  if (shopError || !shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }
  if (!shop.is_online) {
    return NextResponse.json({ error: 'This shop is not accepting print jobs right now' }, { status: 409 })
  }

  const jobId = crypto.randomUUID()
  const paymentStatus = paymentMethod === 'counter' ? 'PENDING_COUNTER' : 'PENDING_UPI'

  const { error: insertError } = await supabaseAdmin.from('print_jobs').insert({
    id: jobId,
    shop_id: shop.id,
    service_code: serviceCode,
    file_url: fileUrl,
    file_type: fileType,
    pages,
    copies,
    is_color: isColor,
    is_duplex: isDuplex,
    total_amount: totalAmount,
    payment_status: paymentStatus,
    print_status: 'QUEUED',
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
  }

  // Notify the shop's desktop agent immediately. If this fails, the job
  // still exists in the database — worth building a periodic reconcile
  // job later, but out of scope here.
  try {
    await triggerPusherEvent({
      channel: `private-shop-${shop.id}`,
      event: 'new-print-job',
      data: {
        id: jobId,
        serviceCode,
        filename,
        fileUrl,
        fileType,
        pages,
        copies,
        isColor,
        isDuplex,
        totalAmount,
      },
    })
  } catch (err) {
    console.error('Pusher trigger failed:', err)
  }

  const response: NewJobResponse = {
    jobId,
    paymentMethod,
  }

  if (paymentMethod === 'upi') {
    const amount = totalAmount.toFixed(2)
    const note = encodeURIComponent(`Print-${jobId.slice(0, 8)}`)
    const payeeName = encodeURIComponent(shop.shop_name)
    response.upiIntentUrl = `upi://pay?pa=${shop.upi_vpa}&pn=${payeeName}&am=${amount}&tn=${note}&cu=INR`
  }

  return NextResponse.json(response)
}
