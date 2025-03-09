// lib/ipts.ts
import { uploadPdfToPinata } from './ipfs';

export async function uploadPdfToIPFS(pdfBlob: Blob, filename: string): Promise<string> {
  try {
    console.log("lib/ipts.ts: Starting PDF upload to Pinata for", filename);
    const cid = await uploadPdfToPinata(pdfBlob);
    console.log("lib/ipts.ts: Successfully uploaded PDF. CID:", cid);
    return cid;
  } catch (error) {
    console.error("lib/ipts.ts: Error uploading PDF to IPFS", error);
    throw error;
  }
}
