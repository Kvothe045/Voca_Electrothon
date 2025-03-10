"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ReportRecord {
  reportId: string;
  activityName: string;
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
        <p className="text-xl">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => router.back()} className="mb-4 text-indigo-400 hover:underline">
        &larr; Back
      </button>
      <h1 className="text-4xl font-bold mb-4">Report Details</h1>
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-2">Report ID: {report.reportId}</h2>
        <p className="mb-2">Activity: {report.activityName}</p>
        <p className="text-sm mb-2">
          PDF Link:{" "}
          <a href={report.pdfLink} target="_blank" rel="noopener noreferrer" className="underline">
            {report.pdfLink}
          </a>
        </p>
        <p className="text-sm mb-2">
          Transaction Link:{" "}
          <a href={report.txLink} target="_blank" rel="noopener noreferrer" className="underline">
            {report.txLink}
          </a>
        </p>
        <p className="text-xs mt-2">
          Created on: {new Date(report.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default SavedReportPage;
