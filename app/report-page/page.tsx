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

interface ShareableLinks {
  pdfLink: string;
  txLink: string;
}

const ReportPage = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
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

  const generatePDF = async () => {
    setGeneratingPdf(true);
    try {
      const { pdfBlob, filename } = await generatePDFFromReport(report);
      // Download locally
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(pdfUrl);

      // Send to server
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

  const handleUploadAndMintNFT = async () => {
    setUploadingPdf(true);
    try {
      const { pdfBlob, filename } = await generatePDFFromReport(report);
      const links = await uploadAndMintNFT(
        pdfBlob,
        filename,
        uploadPdfToIPFS,
        createAndUploadMetadata,
        mintDocument
      );
      toast.success("NFT minted successfully!");
      setShareableLinks(links);

      // Create a new report record
      const newReport = {
        reportId: `${Date.now()}`, // unique ID from timestamp
        activityName: "Sample Activity", // For now, a sample activity name
        pdfLink: links.pdfLink,
        txLink: links.txLink,
        timestamp: new Date().toISOString(),
      };

      // Retrieve current saved reports from local storage
      const saved = localStorage.getItem("savedReports");
      let reports = saved ? JSON.parse(saved) : [];
      reports.push(newReport);
      localStorage.setItem("savedReports", JSON.stringify(reports));
      console.log("Report card added to myReport:", newReport);
    } catch (error) {
      console.error("Error in upload and mint process:", error);
      toast.error("Failed to upload and mint NFT");
    } finally {
      setUploadingPdf(false);
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
      {/* Extra top margin so nothing gets hidden when zooming */}
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
            onClick={generatePDF}
            disabled={generatingPdf}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-70 flex items-center justify-center"
          >
            {generatingPdf ? "Processing..." : "Download & Share PDF Report"}
          </button>
          <button
            onClick={handleUploadAndMintNFT}
            disabled={uploadingPdf}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-70 flex items-center justify-center"
          >
            {uploadingPdf ? "Processing..." : "Upload PDF & Mint NFT"}
          </button>
        </div>
        {shareableLinks && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-gray-900 p-6 rounded-xl max-w-md mx-auto shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">NFT Minted Successfully!</h2>
              <p className="mb-2">Share these links to verify your tamper-proof report:</p>
              <div className="mb-4 space-y-2">
                <div>
                  <strong>PDF Link:</strong>{" "}
                  <a
                    href={shareableLinks.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    {shareableLinks.pdfLink}
                  </a>
                </div>
                <div>
                  <strong>Transaction Link:</strong>{" "}
                  <a
                    href={shareableLinks.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    {shareableLinks.txLink}
                  </a>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareableLinks.pdfLink);
                    toast.success("PDF Link copied to clipboard");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition transform hover:scale-105 text-white"
                >
                  Copy PDF Link
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareableLinks.txLink);
                    toast.success("Transaction Link copied to clipboard");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition transform hover:scale-105 text-white"
                >
                  Copy Transaction Link
                </button>
                <button
                  onClick={() => setShareableLinks(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-xl shadow-lg transition transform hover:scale-105 text-gray-900"
                >
                  Close
                </button>
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
