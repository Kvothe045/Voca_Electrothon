"use client";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { uploadPdfToIPFS } from "../lib/ipts"; // helper for uploading PDF
import { createAndUploadMetadata, mintDocumentNFT } from "../lib/ipfs"; // IPFS minting functions

const ReportPage = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false); // state for IPFS upload & mint chain
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const storedReport = localStorage.getItem("videoReport");
    if (storedReport) {
      setReport(JSON.parse(storedReport));
    } else {
      toast.error("No report data found. Redirecting home...");
      setTimeout(() => router.push("/"), 3000);
    }
    setLoading(false);
  }, [router]);

  // Helper to generate PDF Blob and filename
  const generatePdfBlob = async (): Promise<{ pdfBlob: Blob; filename: string }> => {
    if (!report || !reportContainerRef.current) {
      throw new Error("No report data or container found");
    }
    toast.info("Capturing current report state...");
    const canvas = await html2canvas(reportContainerRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `VOCA_Report_${timestamp}.pdf`;
    const pdfBlob = pdf.output("blob");
    return { pdfBlob, filename };
  };

  // Function: Generate PDF, download it, and send to server (existing functionality)
  const generatePDF = async () => {
    setGeneratingPdf(true);
    try {
      const { pdfBlob, filename } = await generatePdfBlob();

      // Download PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(pdfUrl);

      // Send PDF to server
      const formData = new FormData();
      formData.append("pdf", pdfBlob, filename);
      formData.append("reportData", JSON.stringify(report));
      formData.append("timestamp", new Date().toISOString());

      toast.info("Sending report to server...");
      const response = await fetch("/api/getpdfreport", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        toast.success("PDF successfully sent to server");
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  // New function: Upload PDF to IPFS, create metadata, and mint NFT
  const uploadAndMintNFT = async () => {
    setUploadingPdf(true);
    try {
      // Generate PDF Blob and filename
      const { pdfBlob, filename } = await generatePdfBlob();

      // Upload PDF to IPFS and get the PDF CID
      const pdfCid = await uploadPdfToIPFS(pdfBlob, filename);
      toast.success("PDF successfully uploaded to IPFS");
      console.log("Returned IPFS CID:", pdfCid);

      // Create metadata on IPFS using the PDF CID
      const documentName = filename; // you can adjust the naming scheme if desired
      const description = `PDF document uploaded at ${new Date().toLocaleString()}`;
      console.log("Creating metadata with document name:", documentName);
      const metadataCid = await createAndUploadMetadata(pdfCid, documentName, description);
      console.log("Metadata CID:", metadataCid);

      // Mint NFT using the metadata CID (this should trigger MetaMask for approval)
      console.log("Minting NFT...");
      const mintResult = await mintDocumentNFT(metadataCid);
      console.log("NFT minted successfully:", mintResult);
      toast.success("NFT minted successfully! Check console for details.");
    } catch (error) {
      console.error("Error in upload and mint process:", error);
      toast.error("Failed to upload and mint NFT");
    } finally {
      setUploadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <p className="text-xl mb-4">No report data available.</p>
        <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div 
        className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8" 
        id="report-container"
        ref={reportContainerRef}
      >
        <h1 className="text-4xl font-bold text-center mb-8">VOCA Report</h1>

        {/* Audio Analysis Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Audio Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.audio_output &&
              Object.entries(report.audio_output).map(([key, value]) => (
                <div key={key} className="p-4 border rounded hover:shadow-md transition">
                  <p className="text-gray-600 font-medium">{key}</p>
                  <p className="text-gray-900">{String(value)}</p>
                </div>
              ))}
          </div>
        </section>

        {/* Gemini Analysis Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Gemini Analysis</h2>
          <div className="p-4 border rounded hover:shadow-md transition whitespace-pre-wrap text-gray-800">
            {report.gemini_output}
          </div>
        </section>

        {/* Video Analysis Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Video Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.video_output &&
              Object.entries(report.video_output).map(([key, value]) => (
                <div key={key} className="p-4 border rounded hover:shadow-md transition">
                  <p className="text-gray-600 font-medium">{key}</p>
                  <p className="text-gray-900">{String(value)}</p>
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* Buttons Container */}
      <div className="max-w-4xl mx-auto mt-6 flex justify-center space-x-4">
        <button 
          onClick={generatePDF}
          disabled={generatingPdf}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
        >
          {generatingPdf ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Capturing Report & Downloading PDF...
            </>
          ) : (
            "Download & Share PDF Report"
          )}
        </button>
        <button
          onClick={uploadAndMintNFT}
          disabled={uploadingPdf}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center"
        >
          {uploadingPdf ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Upload PDF & Mint NFT...
            </>
          ) : (
            "Upload PDF & Mint NFT"
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportPage;
