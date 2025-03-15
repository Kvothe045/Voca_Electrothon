"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HeroSection from "../../components/hero-section";
import Footer from "../../components/footer";

interface ReportRecord {
  reportId: string;
  activityName: string;
  grade: string;
  pdfLink: string;
  txLink: string;
  timestamp: string;
}

const SavedReportPage: React.FC = () => {
  const { id } = useParams();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("savedReports");
    if (saved) {
      const reports: ReportRecord[] = JSON.parse(saved);
      const found = reports.find((r) => r.reportId === id);
      if (found) {
        setReport(found);
      }
    }
  }, [id]);

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <HeroSection />
        <main className="pt-32">
          <p className="text-xl text-center">Report not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <HeroSection />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-xl mx-auto bg-gray-800 bg-opacity-70 backdrop-blur-lg rounded-3xl shadow-2xl p-8 transition transform hover:scale-105 animate-fadeIn">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              <span role="img" aria-label="report" className="mr-2">📄</span> Report Details
            </h1>
            <p className="text-lg mb-2">
              <span className="font-bold">Report ID:</span> {report.reportId}
            </p>
            <p className="text-lg mb-2">
              <span className="font-bold">Activity:</span> {report.activityName}
            </p>
            <p className="text-lg mb-2">
              <span className="font-bold">Grade:</span> {report.grade}
            </p>
            <p className="text-sm mb-4">
              <span className="font-bold">Created on:</span> {new Date(report.timestamp).toLocaleString()}
            </p>
            <div className="w-full border-t border-gray-300 pt-4 text-center">
              <p className="text-sm mb-2">
                <span className="font-bold">PDF Link:</span>{" "}
                <a
                  href={report.pdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-indigo-300 hover:text-indigo-400 transition-colors"
                >
                  {report.pdfLink}
                </a>
              </p>
              <p className="text-sm">
                <span className="font-bold">Transaction Link:</span>{" "}
                <a
                  href={report.txLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-indigo-300 hover:text-indigo-400 transition-colors"
                >
                  {report.txLink}
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-6 block mx-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white shadow-lg transition transform hover:scale-105"
          >
            &larr; Back
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SavedReportPage;
