import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockPrintJobs, mockShops } from '@/lib/supabaseAdmin'
import { triggerPusherEvent } from '@/lib/pusherTrigger'
import { NewJobRequest, NewJobResponse } from '@/lib/types'
import { createCashfreeOrder } from '@/lib/cashfree'
import { getShopTrialStatus } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  let body: NewJobRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    shopSlug,
    totalAmount,
    paymentMethod,
    customerPhone,
    customerEmail,
    jobs,
  } = body

  const hasBatch = Array.isArray(jobs) && jobs.length > 0
  const jobItemList = hasBatch
    ? jobs!
    : body.serviceCode && body.fileUrl
    ? [
        {
          serviceCode: body.serviceCode,
          filename: body.filename || 'document.pdf',
          fileUrl: body.fileUrl,
          fileType: body.fileType || 'pdf',
          pages: body.pages || 1,
          pageSelection: body.pageSelection,
          copies: body.copies || 1,
          isColor: body.isColor || false,
          isDuplex: body.isDuplex || false,
          totalAmount: body.totalAmount,
        },
      ]
    : []

  if (!shopSlug || jobItemList.length === 0 || !totalAmount) {
    return NextResponse.json({ error: 'Missing required job fields' }, { status: 400 })
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('slug', shopSlug)
    .single()

  let currentShop: any = shop
  if (!currentShop) {
    const mock = mockShops.find((s) => s.slug === shopSlug)
    if (mock) currentShop = mock
  }

  if (!currentShop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }

  // Enforce 15-day trial / active subscription lock
  const trialStatus = getShopTrialStatus(currentShop)
  if (trialStatus.isLocked) {
    return NextResponse.json(
      { error: 'This print shop is currently inactive (15-day trial expired). Online orders cannot be placed.' },
      { status: 403 }
    )
  }

  if (!currentShop.is_online) {
    return NextResponse.json({ error: 'This shop is not accepting print jobs right now' }, { status: 409 })
  }

  const paymentStatus =
    paymentMethod === 'counter'
      ? 'PENDING_COUNTER'
      : paymentMethod === 'cashfree'
      ? 'PENDING_CASHFREE'
      : 'PENDING_UPI'

  const createdJobIds: string[] = []

  // Create each print job in the database and trigger the counter agent
  for (const item of jobItemList) {
    const jobId = crypto.randomUUID()
    createdJobIds.push(jobId)

    const jobRecord = {
      id: jobId,
      shop_id: currentShop.id,
      service_code: item.serviceCode,
      file_url: item.fileUrl,
      file_type: item.fileType,
      pages: item.pages,
      page_selection: item.pageSelection,
      copies: item.copies,
      is_color: item.isColor,
      is_duplex: item.isDuplex,
      total_amount: item.totalAmount,
      payment_status: paymentStatus,
      print_status: 'QUEUED',
    }

    const { error: insertError } = await supabaseAdmin.from('print_jobs').insert(jobRecord)

    if (insertError) {
      console.warn('[Jobs API] Database insert returned error, saving in memory store:', insertError)
      if (!mockPrintJobs.some((j) => j.id === jobId)) {
        mockPrintJobs.push({
          ...jobRecord,
          created_at: new Date().toISOString(),
        })
      }
    }

    // Notify the shop's desktop agent immediately
    try {
      await triggerPusherEvent({
        channel: `private-shop-${currentShop.id}`,
        event: 'new-print-job',
        data: {
          id: jobId,
          serviceCode: item.serviceCode,
          filename: item.filename,
          fileUrl: item.fileUrl,
          fileType: item.fileType,
          pages: item.pages,
          pageSelection: item.pageSelection,
          copies: item.copies,
          isColor: item.isColor,
          isDuplex: item.isDuplex,
          totalAmount: item.totalAmount,
          paymentMethod,
        },
        credentials: {
          appId: currentShop.pusher_app_id,
          key: currentShop.pusher_key,
          secret: currentShop.pusher_secret,
          cluster: currentShop.pusher_cluster,
        },
      })
    } catch (err) {
      console.warn('[Jobs API] Pusher notification skipped or failed:', err)
    }
  }

  const primaryJobId = createdJobIds[0]

  const response: NewJobResponse = {
    jobId: primaryJobId,
    jobIds: createdJobIds,
    itemsCount: jobItemList.length,
    totalAmount,
    paymentMethod,
    paymentStatus,
  }

  if (paymentMethod === 'upi') {
    const amount = totalAmount.toFixed(2)
    const note = encodeURIComponent(
      hasBatch
        ? `Print-${jobItemList.length}-Docs-${primaryJobId.slice(0, 6)}`
        : `Print-${primaryJobId.slice(0, 8)}`
    )
    const payeeName = encodeURIComponent(currentShop.shop_name)
    response.upiIntentUrl = `upi://pay?pa=${currentShop.upi_vpa}&pn=${payeeName}&am=${amount}&tn=${note}&cu=INR`
  } else if (paymentMethod === 'cashfree') {
    // Generate Cashfree Order Session for merged total
    const sampleNames = jobItemList.map((j) => j.filename).join(', ').slice(0, 32)
    const cfOrder = await createCashfreeOrder(
      {
        orderId: `order_${primaryJobId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}_${Date.now().toString().slice(-4)}`,
        orderAmount: totalAmount,
        customerPhone,
        customerEmail,
        orderNote: hasBatch
          ? `${jobItemList.length} Prints (${sampleNames}) at ${currentShop.shop_name}`
          : `Print: ${sampleNames} at ${currentShop.shop_name}`,
      },
      {
        clientId: currentShop.cashfree_app_id,
        clientSecret: currentShop.cashfree_secret_key,
        env: currentShop.cashfree_env,
      }
    )

    response.paymentSessionId = cfOrder.paymentSessionId
    response.cashfreeEnv = cfOrder.environment
    response.cfOrderId = cfOrder.cfOrderId
  }

  return NextResponse.json(response)
}
