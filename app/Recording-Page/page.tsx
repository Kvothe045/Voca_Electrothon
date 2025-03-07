"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Modal Popup Component with smooth entrance animation
interface UploadPopupProps {
  videoUrl: string;
  onClose: () => void;
  onViewReport: () => void;
}

const UploadPopup: React.FC<UploadPopupProps> = ({ videoUrl, onClose, onViewReport }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn">
      <div className="bg-white p-8 rounded-xl shadow-2xl transform transition-all duration-500">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Upload Successful!</h2>
        <p className="mb-4 text-gray-600">Your video has been uploaded successfully.</p>
        <p className="mb-4 break-all text-gray-700">
          <span className="font-semibold">URL:</span>{" "}
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {videoUrl}
          </a>
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition">
            Close
          </button>
          <button onClick={onViewReport} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};

const RecordingPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // States for recording, upload, and UI animations
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState<number>(0);

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    video: true,
    audio: true,
  });

  // Update recording timer every second
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Get camera stream for live preview
  const getStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error obtaining media stream:", error);
      toast.error("Failed to access your camera and microphone.");
    }
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    await getStream();
    startRecording();
  };

  const handleStopRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    stopRecording();
    setIsRecording(false);
  };

  const handleUpload = async () => {
    if (!mediaBlobUrl) {
      toast.error("No video recorded!");
      return;
    }
    try {
      setIsUploading(true);
      setUploadProgress(0);
      // Convert blob URL into an actual Blob
      const blob = await fetch(mediaBlobUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", blob, "video.mp4");
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        }
      );
      const videoUrl = response.data.secure_url;
      toast.success("Video Uploaded Successfully!");
      setIsUploaded(true);
      setUploadedVideoUrl(videoUrl);
      setShowPopup(true);

      // Send video URL to your backend API for saving to a file at the project root.
      await axios.post("/api/v1/video/save", { videoUrl });
      setIsUploading(false);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload video.");
      setIsUploading(false);
    }
  };

  const handleClosePopup = () => setShowPopup(false);
  const handleViewReport = () => {
    setShowPopup(false);
    router.push("/report");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Header */}
      <header className="w-full bg-black bg-opacity-60 backdrop-blur-lg p-6 shadow-lg fixed top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold">VOCA Video Recorder</h1>
          <nav className="space-x-4">
            <a href="/" className="hover:text-blue-300 transition">Home</a>
            <a href="/about" className="hover:text-blue-300 transition">About</a>
            <a href="/contact" className="hover:text-blue-300 transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-8">
          <p className="text-lg font-semibold">Status: {status}</p>
          {isRecording && <p className="text-sm mt-2">Recording Time: {recordingTime}s</p>}
        </div>
        <div className="flex justify-center">
          <div className="relative bg-gray-800 rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl">
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-semibold">Recording {recordingTime}s</span>
              </div>
            )}
            {isRecording ? (
              <video ref={videoRef} autoPlay className="w-full object-cover h-96" />
            ) : mediaBlobUrl ? (
              <video src={mediaBlobUrl} controls className="w-full object-cover h-96" />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-700">
                <p className="text-2xl">No video recorded yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {!isRecording && !mediaBlobUrl && (
            <button
              onClick={handleStartRecording}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-full shadow-lg transition transform hover:scale-105"
            >
              Start Recording
            </button>
          )}
          {isRecording && (
            <button
              onClick={handleStopRecording}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition transform hover:scale-105"
            >
              Stop Recording
            </button>
          )}
          {mediaBlobUrl && !isRecording && !isUploaded && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition transform hover:scale-105 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
          )}
        </div>

        {isUploading && (
          <div className="w-full max-w-md mt-6 mx-auto">
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-center text-sm">{uploadProgress}%</p>
          </div>
        )}
      </main>

      {/* Footer (if not using separate component) */}
      <footer className="bg-black py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2025 VOCA. All rights reserved.</p>
        </div>
      </footer>

      {/* Modal Popup */}
      {showPopup && (
        <UploadPopup videoUrl={uploadedVideoUrl} onClose={handleClosePopup} onViewReport={handleViewReport} />
      )}
    </div>
  );
};

export default RecordingPage;
