import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyCashfreeOrder } from '@/lib/cashfree'
import { triggerPusherEvent } from '@/lib/pusherTrigger'

export async function POST(req: NextRequest) {
  try {
    const { orderId, jobId, jobIds } = await req.json()

    if (!orderId && !jobId && (!jobIds || jobIds.length === 0)) {
      return NextResponse.json({ error: 'orderId, jobId, or jobIds required' }, { status: 400 })
    }

    const verification = await verifyCashfreeOrder(orderId || jobId || jobIds?.[0])

    if (verification.paymentStatus === 'PAID') {
      const targetJobIds: string[] = jobIds && Array.isArray(jobIds) && jobIds.length > 0
        ? jobIds
        : jobId
        ? [jobId]
        : []

      for (const id of targetJobIds) {
        await supabaseAdmin
          .from('print_jobs')
          .update({
            payment_status: 'PAID_CASHFREE',
          })
          .eq('id', id)

        const { data: job } = await supabaseAdmin
          .from('print_jobs')
          .select('shop_id')
          .eq('id', id)
          .single()

        if (job?.shop_id) {
          try {
            await triggerPusherEvent({
              channel: `private-shop-${job.shop_id}`,
              event: 'payment-received',
              data: {
                jobId: id,
                paymentMethod: 'cashfree',
                status: 'PAID',
              },
            })
          } catch (e) {
            console.warn('Pusher notification error:', e)
          }
        }
      }

      return NextResponse.json({
        success: true,
        status: 'PAID',
        isMock: verification.isMock,
      })
    }

    return NextResponse.json({
      success: false,
      status: verification.paymentStatus,
      isMock: verification.isMock,
    })
  } catch (err) {
    console.error('[Cashfree Verify Error]:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
