"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface ReportRecord {
  reportId: string;
  activityName: string;
  pdfLink: string;
  txLink: string;
  timestamp: string;
}

const MyReportPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    // Retrieve saved reports from local storage
    const saved = localStorage.getItem("savedReports");
    if (saved) {
      setReports(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">My Reports</h1>
      {reports.length === 0 ? (
        <p className="text-lg">
          No reports found. Generate a report and click the Mint & Upload to IPFS button to see it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <Link key={report.reportId} href={`/savedreport/${report.reportId}`}>
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 cursor-pointer">
                <h2 className="text-2xl font-semibold mb-2">Report ID: {report.reportId}</h2>
                <p className="mb-2">Activity: {report.activityName}</p>
                <p className="text-sm">
                  PDF: <span className="underline">{report.pdfLink}</span>
                </p>
                <p className="text-sm">
                  Transaction: <span className="underline">{report.txLink}</span>
                </p>
                <p className="text-xs mt-2">
                  Created on: {new Date(report.timestamp).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportPage;
