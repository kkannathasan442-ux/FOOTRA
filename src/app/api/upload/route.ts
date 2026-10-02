import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary will automatically pick up CLOUDINARY_URL from process.env if set
// But let's configure it explicitly just in case:
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  console.log("Cloudinary Config Status:", {
    cloud_name: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET,
  });
  try {
    const { image } = await request.json(); // base64 image data

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Upload to Cloudinary (Removed folder option in case of permission issues)
    const uploadResponse = await cloudinary.uploader.upload(image);

    return NextResponse.json({ url: uploadResponse.secure_url }, { status: 200 });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
