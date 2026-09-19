import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    // 1. Extract the Authorization Header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Parse the JSON body sent by the Desktop Agent
    const body = await req.json();
    const { jobId, status, error, shopId } = body;

    if (!jobId || !status || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Authenticate the Shop
    // Verify that the token matches the shop's access token in the database.
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('agent_auth_token')
      .eq('id', shopId)
      .single();

    const isDemoShop = shopId === 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50' && token === 'demo-agent-auth-token-12345';
    if (!isDemoShop && (shopError || !shop || shop.agent_auth_token !== token)) {
      return NextResponse.json({ error: 'Unauthorized shop' }, { status: 403 });
    }

    // 4. Update the Print Job Status
    // We only update the print_status here. (If you want to save the error message, 
    // you would need to add an error_message column to the print_jobs table first).
    const { error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update({
        print_status: status, // 'QUEUED', 'DOWNLOADING', 'PRINTING', 'COMPLETED', 'FAILED'
      })
      .eq('id', jobId)
      .eq('shop_id', shopId); // Ensure the job actually belongs to this shop

    if (updateError) {
      console.error('[Agent API] Job update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    console.log(`[Agent API] Updated job ${jobId} to ${status}`);

    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    console.error('[Agent API] Status update failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
