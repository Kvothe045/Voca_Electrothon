"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ChartEvent,
  ActiveElement,
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import HeroSection from "../components/hero-section";
import Footer from "../components/footer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ReportRecord {
  reportId: string;
  activityName: string;
  grade: string; // e.g. "6/10"
  timestamp: string;
  pdfLink?: string;
  txLink?: string;
}

const MyReportPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("savedReports");
    if (saved) {
      setReports(JSON.parse(saved));
    }
  }, []);

  // Sort reports by timestamp (oldest first)
  const sortedReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [reports]);

  // Prepare chart data from sortedReports:
  const chartLabels = sortedReports.map((_, index) => `Report ${index + 1}`);
  const chartDataPoints = sortedReports.map((report) => {
    if (report.grade && report.grade.includes("/")) {
      const [num, denom] = report.grade.split("/").map(Number);
      if (denom > 0) return (num / denom) * 100;
    }
    return 0;
  });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Grade (%)",
        data: chartDataPoints,
        borderColor: "rgba(129,140,248,1)", // soft pastel blue
        backgroundColor: "rgba(129,140,248,0.3)",
        tension: 0.4,
        pointRadius: 8,
        pointHoverRadius: 10,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "My Progress 📈",
        color: "#e0e7ff",
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const report = sortedReports[index];
            return `Report ID: ${report.reportId}, Grade: ${chartDataPoints[index].toFixed(1)}%`;
          },
        },
      },
    },
    onClick: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const report = sortedReports[index];
        router.push(`/savedreport/${report.reportId}`);
      }
    },
    scales: {
      x: {
        ticks: { color: "#e0e7ff", font: { size: 12 } },
        grid: { color: "rgba(224,231,255,0.2)" },
      },
      y: {
        ticks: { color: "#e0e7ff", callback: (value: any) => `${value}%`, font: { size: 12 } },
        grid: { color: "rgba(224,231,255,0.2)" },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  // Calculate average grade percentage and overall score:
  // Overall Score = average * (1 + sqrt(n)/10)
  const { averagePercentage, overallScore } = useMemo(() => {
    const total = sortedReports.length;
    if (total === 0) return { averagePercentage: 0, overallScore: 0 };
    let sum = 0;
    sortedReports.forEach((report) => {
      if (report.grade && report.grade.includes("/")) {
        const [num, denom] = report.grade.split("/").map(Number);
        if (denom > 0) sum += (num / denom) * 100;
      }
    });
    const avg = sum / total;
    const overall = avg * (1 + Math.sqrt(total) / 10);
    return { averagePercentage: avg, overallScore: overall };
  }, [sortedReports]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <HeroSection />
      {/* Extra top padding so HeroSection doesn't hide content */}
      <main className="container mx-auto px-6 pt-32 pb-12 space-y-12">
        <h1 className="text-4xl font-bold mb-4 text-center animate-fadeIn">My Reports</h1>
        <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl animate-fadeIn">
          <p className="text-lg text-center mb-2">
            <span className="font-bold">Average Grade:</span> {averagePercentage.toFixed(1)}%
          </p>
          <p className="text-lg text-center">
            <span className="font-bold">Overall Score:</span> {overallScore.toFixed(1)} <span role="img" aria-label="trophy">🏆</span>
          </p>
        </div>
        {sortedReports.length > 0 && (
          <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl animate-fadeIn">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
        {sortedReports.length === 0 ? (
          <p className="text-lg text-center">
            No reports found. Generate a report and click the Mint & Upload to IPFS button to see it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {sortedReports.map((report) => (
              <Link key={report.reportId} href={`/savedreport/${report.reportId}`}>
                <div className="p-6 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 rounded-3xl shadow-2xl hover:shadow-[0_0_30px_rgba(129,140,248,0.8)] transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2 flex items-center">
                      <span role="img" aria-label="file" className="mr-2">📄</span> Report ID: <span className="font-bold">{report.reportId}</span>
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
