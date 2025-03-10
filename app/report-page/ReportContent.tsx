"use client";
import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface ReportContentProps {
  report: any;
}

const ReportContent: React.FC<ReportContentProps> = ({ report }) => {
  // ----- AUDIO ANALYSIS -----
  const audioData = report.audio_output;
  const speechRate = parseFloat(audioData["Speech Rate (words per minute)"]) || 0;
  const pauses = parseFloat(audioData["Pauses"]) || 0;
  
  const audioChartData = {
    labels: ["Speech Rate", "Pauses"],
    datasets: [
      {
        label: "Audio Metrics",
        data: [speechRate, pauses],
        backgroundColor: ["rgba(99, 102, 241, 0.8)", "rgba(249, 115, 22, 0.8)"],
        borderColor: ["rgba(99, 102, 241, 1)", "rgba(249, 115, 22, 1)"],
        borderWidth: 2,
      },
    ],
  };

  // ----- GEMINI ANALYSIS (AI Content Analysis) -----
  const geminiText: string = report.gemini_output;
  const rawSections = geminiText
    .split("\n\n---\n\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // Initialize Gemini section variables
  let aiIntro = "";
  let grammaticalErrors = "";
  let relevance = "";
  let repetition = "";
  let vocabulary = "";
  let strengths = "";
  let weaknesses = "";
  let summary = "";

  rawSections.forEach((section) => {
    const lower = section.toLowerCase();
    if (lower.startsWith("okay,")) {
      aiIntro = section;
    } else if (lower.startsWith("grammatical errors")) {
      let lines = section.split("\n").filter(Boolean);
      if (lines[0].toLowerCase().includes("grammatical errors")) {
        lines = lines.slice(1);
      }
      grammaticalErrors = lines.join("\n").trim();
      // Apply text replacements as requested
      grammaticalErrors = grammaticalErrors
        .replace(/- changed the way of education/gi, "- changed education")
        .replace(/online education has travelled by now/gi, "online education has come a long way")
        .replace(/online education is best because it is accessible to everyone/gi, "Online education offers significant advantages in terms of accessibility.");
    } else if (lower.startsWith("relevance")) {
      let lines = section.split("\n").filter(Boolean);
      if (lines[0].toLowerCase().includes("relevance")) {
        lines = lines.slice(1);
      }
      relevance = lines.join("\n").trim();
    } else if (lower.startsWith("repetition")) {
      let lines = section.split("\n").filter(Boolean);
      if (lines[0].toLowerCase().includes("repetition")) {
        lines = lines.slice(1);
      }
      repetition = lines.join("\n").trim();
    } else if (lower.startsWith("vocabulary")) {
      let lines = section.split("\n").filter(Boolean);
      if (lines[0].toLowerCase().includes("vocabulary")) {
        lines = lines.slice(1);
      }
      vocabulary = lines.join("\n").trim();
    } else if (lower.startsWith("strengths") && lower.includes("weaknesses")) {
      const parts = section.split(/\n\nweaknesses\n\n/i);
      strengths = parts[0].replace(/^(strengths\s*\n)/i, "").trim();
      weaknesses = parts[1].trim();
    } else if (lower.startsWith("strengths")) {
      let lines = section.split("\n").filter(Boolean);
      if (lines[0].toLowerCase().includes("strengths")) {
        lines = lines.slice(1);
      }
      strengths = lines.join("\n").trim();
    } else if (lower.startsWith("weaknesses")) {
      let lines = section.split("\n").filter(Boolean);
      if (lines[0].toLowerCase().includes("weaknesses")) {
        lines = lines.slice(1);
      }
      weaknesses = lines.join("\n").trim();
    } else if (lower.startsWith("summary:")) {
      summary = section.replace(/^summary:\s*/i, "").trim();
    }
  });

  // Helper: render bullet list from text
  const renderBulletList = (text: string) => {
    const items = text.split("\n").filter((line) => line.trim().startsWith("*"));
    return (
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start">
            <span className="text-indigo-400 mr-2">•</span>
            <span>{item.replace(/^\*\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  };

  // ----- VIDEO ANALYSIS -----
  const videoOutput = report.video_output;

  // ----- OVERALL GRADE -----
  const gradeMatch = geminiText.match(/Grade:\s*(\d+)\/(\d+)/i);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : 0;
  const maxGrade = gradeMatch ? parseInt(gradeMatch[2]) : 10;
  const gradePercent = (grade / maxGrade) * 100;

  // Relevance percentage
  let relevancePercent = 0;
  const relevanceMatchForPercent = relevance.match(/(\d+)%/);
  if (relevanceMatchForPercent) {
    relevancePercent = parseInt(relevanceMatchForPercent[1]);
  }

  // Card colors based on values
  const getColorClass = (value: string | number, type: string) => {
    if (type === "rating") {
      const numValue = typeof value === "number" ? value : parseFloat(value);
      if (numValue <= 3) return "from-red-500 to-red-400";
      if (numValue <= 7) return "from-yellow-500 to-amber-400";
      return "from-green-500 to-emerald-400";
    }

    if (type === "percentage") {
      const numValue =
        typeof value === "string"
          ? parseInt(value.replace("%", ""))
          : typeof value === "number"
          ? value
          : 0;

      if (numValue < 50) return "from-red-500 to-red-400";
      if (numValue < 75) return "from-yellow-500 to-amber-400";
      return "from-green-500 to-emerald-400";
    }

    return "from-blue-500 to-indigo-500"; // default
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Header with animated gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-10 blur-xl"></div>
        <div className="relative bg-gray-900 rounded-xl shadow-xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-block p-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4">
              <span className="text-4xl">🎤</span>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 mb-3">
              Voca Analysis Report
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mx-auto">
              Detailed breakdown of your performance with AI-powered insights
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-6">
            <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4 shadow-lg">
              <div className="bg-indigo-500 bg-opacity-20 rounded-full p-3 flex-shrink-0">
                <span className="text-2xl">🎙️</span>
              </div>
              <div>
                <h3 className="text-gray-300 text-sm">Speech Rate</h3>
                <p className="text-xl font-bold text-white">
                  {audioData["Speech Rate (words per minute)"]} wpm
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4 shadow-lg">
              <div className="bg-pink-500 bg-opacity-20 rounded-full p-3 flex-shrink-0">
                <span className="text-2xl">🎥</span>
              </div>
              <div>
                <h3 className="text-gray-300 text-sm">Facial Expressions</h3>
                <p className="text-xl font-bold text-white">
                  {videoOutput["Facial Expressions (Percentage)"]}
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4 shadow-lg">
              <div className="bg-purple-500 bg-opacity-20 rounded-full p-3 flex-shrink-0">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-gray-300 text-sm">Overall Grade</h3>
                <p className="text-xl font-bold text-white">
                  {grade}/{maxGrade} ({Math.round(gradePercent)}%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Showcase */}
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-2">🏆</span>
              Overall Performance
            </h2>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              {grade}/{maxGrade}
            </div>
          </div>

          <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${gradePercent}%`, transition: "width 1s ease-in-out" }}
            ></div>
          </div>

          {summary && (
            <div className="p-5 bg-gray-800 rounded-xl mt-5">
              <h3 className="text-xl font-semibold text-white mb-3">Executive Summary</h3>
              <p className="text-gray-300 leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Audio Analysis Section (Full-Width) */}
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">🎙️</span>
            Audio Analysis
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(audioData).slice(0, 4).map(([key, value]) => (
              <div key={key} className="bg-gray-800 rounded-lg p-4 transition-all hover:bg-gray-750 hover:shadow-lg">
                <h3 className="text-gray-400 text-sm mb-1">{key}</h3>
                <p className="text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mb-6">
            <Bar
              data={audioChartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false }, title: { display: false } },
                scales: {
                  x: { ticks: { color: "rgba(255,255,255,0.7)" }, grid: { display: false } },
                  y: { ticks: { color: "rgba(255,255,255,0.7)" }, grid: { color: "rgba(255,255,255,0.1)" } },
                },
              }}
            />
          </div>
          <div className="rounded-lg p-4 bg-indigo-900 bg-opacity-30">
            <h3 className="text-white text-lg mb-2 font-semibold">Additional Audio Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(audioData).slice(4).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></div>
                  <div className="text-sm">
                    <span className="text-gray-300">{key}: </span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Analysis Section (Full-Width) */}
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">🎥</span>
            Video Analysis
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(videoOutput).map(([key, value], idx) => {
              const isRating = key.toLowerCase().includes("rating");
              const isPercentage = String(value).includes("%");
              const colorClass = isRating
                ? getColorClass(value, "rating")
                : isPercentage
                ? getColorClass(value, "percentage")
                : "from-blue-500 to-indigo-500";
              return (
                <div key={idx} className={`p-5 rounded-xl bg-gradient-to-r ${colorClass} shadow-lg`}>
                  <h3 className="text-xl font-semibold text-white mb-1">{key}</h3>
                  <p className="text-2xl font-bold text-white mb-2">{value}</p>
                  {key === "Hand Gesture Rating (out of 10)" && (
                    <div className="w-full h-2 bg-white bg-opacity-30 rounded-full mt-2">
                      <div className="h-full bg-white rounded-full" style={{ width: `${(Number(value) / 10) * 100}%` }}></div>
                    </div>
                  )}
                  {key === "Facial Expressions (Percentage)" && (
                    <div className="w-full h-2 bg-white bg-opacity-30 rounded-full mt-2">
                      <div className="h-full bg-white rounded-full" style={{ width: String(value).replace("%", "") }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Content Analysis Section */}
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            AI Content Analysis
          </h2>
        </div>
        <div className="p-5">
          {/* Introduction Block */}
          {aiIntro && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Introduction</h3>
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-300 italic">{aiIntro}</p>
              </div>
            </div>
          )}

          {/* Grammatical Errors & Relevance Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {grammaticalErrors && (
              <div className="bg-gray-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="text-red-400 mr-2">🔍</span>
                  Grammatical Errors
                </h3>
                <div className="text-gray-300">{renderBulletList(grammaticalErrors)}</div>
              </div>
            )}
            {relevance && (
              <div className="bg-gray-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-indigo-400 mr-2">📊</span>
                  Relevance
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300">Content Relevance</span>
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                    {relevancePercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded-full mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${relevancePercent}%` }}
                  ></div>
                </div>
                <div className="text-gray-300">{renderBulletList(relevance)}</div>
              </div>
            )}
          </div>

          {/* Repetition & Vocabulary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {repetition && (
              <div className="bg-gray-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="text-amber-400 mr-2">🔄</span>
                  Repetition
                </h3>
                <div className="text-gray-300">{renderBulletList(repetition)}</div>
              </div>
            )}
            {vocabulary && (
              <div className="bg-gray-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="text-emerald-400 mr-2">📚</span>
                  Vocabulary
                </h3>
                <div className="text-gray-300">{renderBulletList(vocabulary)}</div>
              </div>
            )}
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strengths && (
              <div className="p-5 rounded-lg bg-gradient-to-br from-green-900 to-emerald-900 bg-opacity-30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="text-emerald-400 mr-2">⭐</span>
                  Strengths
                </h3>
                <div className="text-gray-200">{renderBulletList(strengths)}</div>
              </div>
            )}
            {weaknesses && (
              <div className="p-5 rounded-lg bg-gradient-to-br from-red-900 to-rose-900 bg-opacity-30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="text-red-400 mr-2">⚠️</span>
                  Areas for Improvement
                </h3>
                <div className="text-gray-200">{renderBulletList(weaknesses)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportContent;
