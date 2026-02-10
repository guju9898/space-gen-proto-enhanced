import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type - only JPEG and PNG supported for Replicate compatibility
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG and PNG images are supported" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate unique file path
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split(".").pop() || "jpg"
    const filePath = `interior-reference/${timestamp}-${randomId}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("renders")
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload image", details: uploadError.message },
        { status: 500 }
      )
    }

    // Create signed URL (60 second expiry - sufficient for Replicate to fetch)
    const { data: signed, error } = await supabase.storage
      .from("renders")
      .createSignedUrl(filePath, 60)

    if (error || !signed?.signedUrl) {
      throw new Error("Failed to create signed image URL")
    }

    console.log("✅ Image uploaded to Supabase:", signed.signedUrl)

    return NextResponse.json({
      imageUrl: signed.signedUrl,
      filePath
    })
  } catch (err: any) {
    console.error("❌ Upload error:", err)
    return NextResponse.json(
      { error: "Failed to process upload", details: err?.message },
      { status: 500 }
    )
  }
}

