import { uploadPdfToPinata, createAndUploadMetadata, mintDocumentNFT } from './ipfs';

export interface ListenerStatus {
  isActive: boolean;
  lastProcessedTime: Date | null;
  currentStatus: 'idle' | 'fetching' | 'uploading' | 'minting' | 'completed' | 'error';
  error: string | null;
  result: {
    transactionHash?: string;
    tokenId?: string;
    shareableUrl?: string;
  } | null;
}

let status: ListenerStatus = {
  isActive: false,
  lastProcessedTime: null,
  currentStatus: 'idle',
  error: null,
  result: null
};

let listenerInterval: NodeJS.Timeout | null = null;
const POLL_INTERVAL = 5000; // Check every 5 seconds

export function getListenerStatus(): ListenerStatus {
  return { ...status };
}

export function startListener(
  onStatusChange?: (status: ListenerStatus) => void,
  onNewResult?: (result: ListenerStatus['result']) => void
) {
  if (status.isActive) {
    return;
  }
  
  status = {
    isActive: true,
    lastProcessedTime: null,
    currentStatus: 'idle',
    error: null,
    result: null
  };
  
  if (onStatusChange) {
    onStatusChange(status);
  }
  
  const checkForNewPdf = async () => {
    try {
      // Set initial status to "fetching"
      status.currentStatus = 'fetching';
      if (onStatusChange) onStatusChange({ ...status });
  
      // Try to fetch the PDF
      const response = await fetch('/api/getpdfreport', {
        method: 'GET',
        headers: {
          'If-Modified-Since': status.lastProcessedTime
            ? new Date(status.lastProcessedTime).toUTCString()
            : new Date(0).toUTCString(),
        },
      });
  
      // If no new PDF (304 Not Modified)
      if (response.status === 304) {
        status.currentStatus = 'idle';
        if (onStatusChange) onStatusChange({ ...status });
        return;
      }
  
      // If not found (404)
      if (response.status === 404) {
        status.currentStatus = 'idle';
        if (onStatusChange) onStatusChange({ ...status });
        return;
      }
  
      // If we got a PDF (response.ok)
      if (response.ok) {
        console.log("New PDF detected from API endpoint.");
        const pdfBlob = await response.blob();
        status.lastProcessedTime = new Date();
  
        // Upload to Pinata
        status.currentStatus = 'uploading';
        if (onStatusChange) onStatusChange({ ...status });
        console.log("Starting PDF upload to Pinata...");
        
        const pdfCid = await uploadPdfToPinata(pdfBlob);
  
        const documentName = `Document-${new Date().toISOString()}`;
        const metadataCid = await createAndUploadMetadata(
          pdfCid,
          documentName,
          `PDF document uploaded at ${new Date().toLocaleString()}`
        );
  
        // Mint NFT
        status.currentStatus = 'minting';
        if (onStatusChange) onStatusChange({ ...status });
        console.log("Starting NFT minting process...");
        
        const mintResult = await mintDocumentNFT(metadataCid);
  
        status.currentStatus = 'completed';
        status.result = mintResult;
        console.log("Process completed. Minting result:", mintResult);
        if (onStatusChange) onStatusChange({ ...status });
        if (onNewResult) onNewResult(mintResult);
      }
    } catch (error: any) {
      status.currentStatus = 'error';
      status.error = error.message || 'Unknown error occurred';
      if (onStatusChange) onStatusChange({ ...status });
      console.error('PDF listener error:', error);
    }
  };
  
  
  // Start polling
  listenerInterval = setInterval(checkForNewPdf, POLL_INTERVAL);
  
  // Initial check
  checkForNewPdf();
  
  return () => stopListener();
}

export function stopListener() {
  if (listenerInterval) {
    clearInterval(listenerInterval);
    listenerInterval = null;
  }
  
  status.isActive = false;
  status.currentStatus = 'idle';
}