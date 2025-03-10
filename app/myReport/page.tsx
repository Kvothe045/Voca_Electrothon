"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import HeroSection from "../components/hero-section";
import Footer from "../components/footer";

interface ReportRecord {
  reportId: string;
  activityName: string;
  grade: string;
  timestamp: string;
}

const MyReportPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("savedReports");
    if (saved) {
      setReports(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <HeroSection />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <h1 className="text-4xl font-bold mb-8 text-center">My Reports</h1>
        {reports.length === 0 ? (
          <p className="text-lg text-center">
            No reports found. Generate a report and click the Mint & Upload to IPFS button to see it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reports.map((report) => (
              <Link key={report.reportId} href={`/savedreport/${report.reportId}`}>
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 cursor-pointer">
                  <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2">
                      Report ID: {report.reportId}
                    </h2>
                    <p className="mb-2 text-center">
                      <span className="font-bold">Activity:</span> {report.activityName}
                    </p>
                    <p className="mb-2 text-center">
                      <span className="font-bold">Grade:</span> {report.grade}
                    </p>
                    <p className="text-xs text-center">
                      <span className="font-bold">Created on:</span> {new Date(report.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyReportPage;
