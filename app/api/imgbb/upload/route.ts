import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const apiKey =
      (formData.get('apiKey') as string) ||
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'ImgBB API Key is required. Please enter your free API key from https://api.imgbb.com or set IMGBB_API_KEY in environment variables.',
          needsKey: true,
        },
        { status: 400 }
      )
    }

    // Prepare FormData for ImgBB API
    const imgbbForm = new FormData()
    imgbbForm.append('image', file)

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'POST',
        body: imgbbForm,
      }
    )

    const data = await res.json()

    if (!res.ok || !data.success) {
      return NextResponse.json(
        {
          error: data?.error?.message || 'ImgBB upload failed. Please verify your API key.',
        },
        { status: res.status || 500 }
      )
    }

    // Direct image URL on i.ibb.co
    const directImageUrl = data.data.url || data.data.display_url || data.data.image?.url

    return NextResponse.json({
      success: true,
      url: directImageUrl,
      viewerUrl: data.data.url_viewer,
      title: data.data.title,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to upload to ImgBB' },
      { status: 500 }
    )
  }
}
