import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy image endpoint for Studio preview
 * Streams remote images to avoid CORS issues and browser fetching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("u");

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing image URL parameter" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    // Only allow HTTP/HTTPS URLs
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs are allowed" }, { status: 400 });
    }

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(imageUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "SpaceGen-Studio/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        return NextResponse.json(
          { error: "URL does not point to an image" },
          { status: 400 }
        );
      }

      // Get the image data
      const imageBuffer = await response.arrayBuffer();

      // Stream the image back to the client
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": imageBuffer.byteLength.toString(),
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Image fetch timeout" },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { error: `Failed to fetch image: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



