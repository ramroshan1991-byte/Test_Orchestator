import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Persist the store across HMR reloads in development
const globalStore = global as unknown as { downloadStore: Map<string, { buffer: Uint8Array, type: string, filename: string }> };
if (!globalStore.downloadStore) {
  globalStore.downloadStore = new Map();
}
const downloadStore = globalStore.downloadStore;

const generateUUID = () => crypto.randomUUID();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload, type, filename, isBase64 } = body;
    
    if (!payload || !type || !filename) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let buffer: Uint8Array;
    if (isBase64) {
      const sanitized = payload.includes(',') ? payload.split(',')[1] : payload;
      const b = Buffer.from(sanitized, 'base64');
      buffer = new Uint8Array(b);
    } else {
      buffer = new TextEncoder().encode(payload);
    }

    const key = generateUUID();
    downloadStore.set(key, { buffer, type, filename });
    setTimeout(() => downloadStore.delete(key), 60000);

    return NextResponse.json({ key });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to prepare download' }, { status: 500 });
  }
}

// GET handler now accepts the filename in the path if needed, 
// but we'll stick to searchParams and fix the headers to be much more aggressive.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (!key || !downloadStore.has(key)) {
    return new NextResponse('Download expired', { status: 410 });
  }

  const { buffer, type, filename } = downloadStore.get(key)!;
  downloadStore.delete(key);

  const safeFilename = filename.replace(/["\\]/g, '');

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
