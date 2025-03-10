"use client";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { generatePDFFromReport, uploadAndMintNFT } from "./pdfGenerator";
import { uploadPdfToIPFS } from "../lib/ipts";
import { createAndUploadMetadata } from "../lib/ipfs";
import { mintDocument } from "../lib/minting";
import ReportContent from "./ReportContent";
import HeroSection from "../components/hero-section";
import Footer from "../components/footer";
import { X } from "lucide-react"; // Import X icon for close button

interface ShareableLinks {
  pdfLink: string;
  txLink: string;
  pdfBlob?: Blob;
  filename?: string;
}

const ReportPage = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [shareableLinks, setShareableLinks] = useState<ShareableLinks | null>(null);
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

  const handleSaveAndMint = async () => {
    setProcessing(true);
    try {
      const { pdfBlob, filename } = await generatePDFFromReport(report);
      const links = await uploadAndMintNFT(
        pdfBlob,
        filename,
        uploadPdfToIPFS,
        createAndUploadMetadata,
        mintDocument
      );
      
      // Store blob and filename for download functionality
      links.pdfBlob = pdfBlob;
      links.filename = filename;
      
      toast.success("NFT minted successfully!");
      setShareableLinks(links);

      // Use a robust regex to extract grade (allowing newlines)
      const gradeMatch = report.gemini_output.match(/Grade:\s*\n*\s*(\d+)\/(\d+)/i);
      const gradeStr = gradeMatch ? `${gradeMatch[1]}/${gradeMatch[2]}` : "N/A";

      // Create a new report record with unique id
      const newReport = {
        reportId: `${Date.now()}`, // unique ID
        activityName: "Sample Activity", // to be replaced with dynamic data later
        grade: gradeStr,
        pdfLink: links.pdfLink,
        txLink: links.txLink,
        timestamp: new Date().toISOString(),
      };

      // Retrieve and update saved reports in local storage
      const saved = localStorage.getItem("savedReports");
      let reports = saved ? JSON.parse(saved) : [];
      reports.push(newReport);
      localStorage.setItem("savedReports", JSON.stringify(reports));
      console.log("Report card added to myReport:", newReport);
    } catch (error) {
      console.error("Error in save and mint process:", error);
      toast.error("Failed to save and mint NFT");
    } finally {
      setProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (shareableLinks?.pdfBlob && shareableLinks?.filename) {
      const pdfUrl = URL.createObjectURL(shareableLinks.pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = shareableLinks.filename;
      link.click();
      URL.revokeObjectURL(pdfUrl);
      toast.success("PDF downloaded successfully");
    } else {
      toast.error("PDF not available for download");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0e] text-white">
        <p className="text-xl">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0e] text-white">
        <p className="text-xl mb-4">No report data available.</p>
        <button 
          onClick={() => router.push("/")} 
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition transform hover:scale-105"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white">
      <HeroSection />
      {/* Add extra top margin (pt-64) so HeroSection doesn't hide content */}
      <main className="mt-64 container mx-auto px-6 pb-12 space-y-12">
        <div
          className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 bg-opacity-90 shadow-2xl rounded-xl p-8 transition transform origin-bottom hover:scale-105"
          id="report-container"
          ref={reportContainerRef}
        >
          <ReportContent report={report} />
        </div>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            onClick={handleSaveAndMint}
            disabled={processing}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-70 flex items-center justify-center"
          >
            {processing ? "Processing..." : "Save & Mint"}
          </button>
        </div>
        
        {/* Improved modal popup */}
        {shareableLinks && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 text-white p-8 rounded-xl max-w-lg w-full mx-auto shadow-2xl border border-gray-700">
              {/* Close button */}
              <button 
                onClick={() => setShareableLinks(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                aria-label="Close popup"
              >
                <X size={24} />
              </button>
              
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">NFT Minted Successfully!</h2>
                  <p className="text-gray-300">Your report has been securely stored on the blockchain</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">PDF Link</p>
                    <a
                      href={shareableLinks.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm break-all hover:underline"
                    >
                      {shareableLinks.pdfLink}
                    </a>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Transaction Link</p>
                    <a
                      href={shareableLinks.txLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm break-all hover:underline"
                    >
                      {shareableLinks.txLink}
                    </a>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={downloadPDF}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg transition transform hover:scale-105 text-white font-medium"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`PDF: ${shareableLinks.pdfLink}\nTransaction: ${shareableLinks.txLink}`);
                      toast.success("Links copied to clipboard");
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition transform hover:scale-105 text-white font-medium"
                  >
                    Copy All Links
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReportPage;