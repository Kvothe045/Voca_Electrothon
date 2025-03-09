'use client';

import { useState, useEffect, useRef } from 'react';
import { startListener, stopListener, getListenerStatus, ListenerStatus } from '../lib/pdfListenerService';

export default function DocumentProcessor() {
  const [isUploading, setIsUploading] = useState(false);
  const [listenerStatus, setListenerStatus] = useState<ListenerStatus>(getListenerStatus());
  const [showShareModal, setShowShareModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Start the listener when component mounts
  useEffect(() => {
    const stopListenerFn = startListener(
      // Status change callback
      (status) => {
        setListenerStatus({...status});
      },
      // New result callback
      (result) => {
        if (result && result.shareableUrl) {
          setShowShareModal(true);
        }
      }
    );
    
    // Clean up listener on unmount
    return () => {
      if (stopListenerFn) stopListenerFn();
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      if (!fileInputRef.current?.files?.[0]) {
        throw new Error('Please select a PDF file');
      }
      
      const formData = new FormData();
      formData.append('pdf', fileInputRef.current.files[0]);
      
      // Upload to server endpoint
      const response = await fetch('/api/getpdfreport', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }
      
      // The listener will automatically detect the new PDF
      // and handle the rest of the process
      
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Failed to upload document'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Document NFT Minter</h2>
      
      {/* Status display */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="font-semibold">Status: {listenerStatus.currentStatus}</p>
        {listenerStatus.error && (
          <p className="text-red-500 text-sm">{listenerStatus.error}</p>
        )}
      </div>
      
      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">PDF Document</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>
        
        <p className="text-xs text-gray-500">
          After uploading, the system will automatically mint an NFT for your document.
          You'll need to approve the transaction with MetaMask.
        </p>
      </form>
      
      {/* Share modal */}
      {showShareModal && listenerStatus.result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Document Successfully Minted!</h3>
            
            <div className="space-y-3">
              <p className="font-medium">Your document is now tamper-proof and stored on the blockchain.</p>
              
              <div>
                <p className="font-semibold">Transaction Hash:</p>
                <p className="text-xs break-all bg-gray-100 p-2 rounded">
                  {listenerStatus.result.transactionHash}
                </p>
              </div>
              
              <div>
                <p className="font-semibold">Token ID:</p>
                <p>{listenerStatus.result.tokenId}</p>
              </div>
              
              <div>
                <p className="font-semibold">Shareable URL:</p>
                <a
                  href={listenerStatus.result.shareableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:underline text-sm mt-1 break-all bg-gray-100 p-2 rounded"
                >
                  {listenerStatus.result.shareableUrl}
                </a>
                <p className="text-xs mt-1">
                  Share this link with anyone to view your tamper-proof document.
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    // Reset the result so we don't show this again for the same document
                    setListenerStatus(prev => ({
                      ...prev,
                      result: null
                    }));
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}