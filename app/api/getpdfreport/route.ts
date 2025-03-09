import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Path to store the latest PDF
const PDF_STORAGE_PATH = path.join(os.tmpdir(), 'latest-document.pdf');
let lastModified = new Date(0);

// Helper to ensure the temp directory exists
async function ensureTempDir() {
  try {
    await fs.access(os.tmpdir());
  } catch (error) {
    await fs.mkdir(os.tmpdir(), { recursive: true });
  }
}

// GET handler - returns the latest PDF
export async function GET(req: NextRequest) {
  try {
    // Check if we have a PDF stored
    await ensureTempDir();
    
    try {
      await fs.access(PDF_STORAGE_PATH);
    } catch (error) {
      return new NextResponse('No PDF available', { status: 404 });
    }
    
    // Check if-modified-since header
    const ifModifiedSince = req.headers.get('if-modified-since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (clientDate >= lastModified) {
        return new NextResponse(null, { status: 304 }); // Not Modified
      }
    }
    
    // Read and return the PDF
    const pdfBuffer = await fs.readFile(PDF_STORAGE_PATH);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error getting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to get PDF' },
      { status: 500 }
    );
  }
}

// POST handler - saves a new PDF
export async function POST(req: NextRequest) {
  try {
    await ensureTempDir();
    
    // Parse form data
    const formData = await req.formData();
    const pdfFile = formData.get('pdf');
    
    if (!pdfFile || !(pdfFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }
    
    // Convert Blob to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save PDF to temp storage
    await fs.writeFile(PDF_STORAGE_PATH, buffer);
    lastModified = new Date();
    
    return NextResponse.json({
      success: true,
      message: 'PDF successfully uploaded'
    });
  } catch (error) {
    console.error('Error saving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to save PDF' },
      { status: 500 }
    );
  }
}