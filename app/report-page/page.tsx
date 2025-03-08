"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ReportPage = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-8">VOCA Report</h1>
        
        {/* Audio Analysis Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Audio Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.audio_output &&
              Object.entries(report.audio_output).map(([key, value]) => (
                <div key={key} className="p-4 border rounded hover:shadow-md transition">
                  <p className="text-gray-600 font-medium">{key}</p>
                  <p className="text-gray-900">{value}</p>
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
                  <p className="text-gray-900">{value}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportPage;
