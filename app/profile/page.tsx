"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Footer from "../components/footer";
import HeroSection from "../components/hero-section";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// A reusable progress chart component with more varied data
const ProgressChart: React.FC = () => {
  const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Soft Skills Improvement (%)",
        // Varied data to show non-linear progress
        data: [50, 68, 60, 72, 64, 80],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Progress Over Time" },
    },
  };

  return (
    <div className="w-full max-w-lg">
      <Line data={data} options={options} />
    </div>
  );
};

export default function ProfilePage() {
  // Default placeholder profile image – replace with your asset as needed
  const defaultProfileImage = "/default-profile.png";
  const [profileImage, setProfileImage] = useState<string>(defaultProfileImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default profile details
  const [name, setName] = useState<string>("Raj Dev");
  const [education, setEducation] = useState<string>("BE CSE");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Create an object URL for immediate preview
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <HeroSection />
      <main className="pt-20 container mx-auto px-4 pb-8 space-y-12">
        {/* Profile Card */}
        <div className="max-w-md mx-auto bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-6 transform transition hover:scale-105">
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Profile Picture */}
              <img
                src={profileImage}
                alt="Profile Picture"
                className="h-32 w-32 rounded-full object-cover border-4 border-blue-500"
              />
              {/* Change Picture Button */}
              <button
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-2 shadow-lg transform hover:scale-110 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 11l3-3m0 0l3-3m-3 3v12"
                  />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {/* Profile Details */}
            <h2 className="mt-4 text-2xl font-bold">{name}</h2>
            <p className="mt-1 text-gray-300">{education}</p>
            <div className="mt-6 w-full">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition transform hover:scale-105">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <section>
          <h3 className="text-xl font-bold text-center">My Achievements</h3>
          <div className="mt-6 grid grid-cols-3 gap-6 justify-items-center">
            {/* Badge 1: Top Communicator */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.082 6.403a1 1 0 00.95.69h6.741c.969 0 1.371 1.24.588 1.81l-5.456 3.97a1 1 0 00-.364 1.118l2.082 6.403c.3.921-.755 1.688-1.54 1.118l-5.456-3.97a1 1 0 00-1.175 0l-5.456 3.97c-.784.57-1.838-.197-1.54-1.118l2.082-6.403a1 1 0 00-.364-1.118L2.27 12.83c-.783-.57-.38-1.81.588-1.81h6.741a1 1 0 00.95-.69l2.082-6.403z"
                  />
                </svg>
              </div>
              <span className="mt-2 text-sm text-center">Top Communicator</span>
            </div>
            {/* Badge 2: Team Player */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <span className="mt-2 text-sm text-center">Team Player</span>
            </div>
            {/* Badge 3: Active Listener */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
                </svg>
              </div>
              <span className="mt-2 text-sm text-center">Active Listener</span>
            </div>
            {/* Badge 4: Conflict Resolver */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0" />
                </svg>
              </div>
              <span className="mt-2 text-sm text-center">Conflict Resolver</span>
            </div>
            {/* Badge 5: Empathetic */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center opacity-50 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h.01" />
                </svg>
              </div>
              <span className="mt-2 text-sm text-center opacity-50">Empathetic</span>
            </div>
            {/* Badge 6: Public Speaking */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center opacity-50 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
              </div>
              <span className="mt-2 text-sm text-center opacity-50">Public Speaking</span>
            </div>
          </div>
        </section>

        {/* Progress Graph Section */}
        <section>
          <h3 className="text-xl font-bold text-center">My Progress</h3>
          <div className="flex justify-center mt-6">
            <ProgressChart />
          </div>
        </section>

        {/* Reports Section */}
        <section>
          <h3 className="text-xl font-bold text-center">My Reports</h3>
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="bg-gray-800 bg-opacity-90 rounded-xl p-4 flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Soft Skills Analysis Report</h4>
                <p className="text-sm text-gray-300">
                  Your communication and teamwork skills have improved by 20% over the last month.
                </p>
              </div>
            </div>
            <div className="bg-gray-800 bg-opacity-90 rounded-xl p-4 flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Presentation Skills Report</h4>
                <p className="text-sm text-gray-300">
                  Your clarity and engagement during presentations have steadily improved.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
