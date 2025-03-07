"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "../components/footer";

// Modal Popup Component with smooth entrance animation
interface UploadPopupProps {
  videoUrl: string;
  onClose: () => void;
  onViewReport: () => void;
}

const UploadPopup: React.FC<UploadPopupProps> = ({ videoUrl, onClose, onViewReport }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl shadow-2xl transform transition-all duration-500">
        <h2 className="text-2xl font-bold mb-3 text-gray-800">Upload Successful!</h2>
        <p className="mb-3 text-gray-600">Your video has been uploaded successfully.</p>
        <p className="mb-3 break-all text-gray-700 text-sm">
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
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition text-sm">
            Close
          </button>
          <button onClick={onViewReport} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm">
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};

const RecordingPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicFromQuery = searchParams.get("topic");

  // States for recording, upload, and UI animations
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [topic, setTopic] = useState<string>(topicFromQuery || "AI: Boon or Bane?");
  const [keywords, setKeywords] = useState<string[]>(["artificial intelligence", "technology", "ethics", "future", "society"]);
  const [isLoadingTopic, setIsLoadingTopic] = useState<boolean>(!topicFromQuery);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    video: true,
    audio: true,
  });

  // If topic is not provided via query, fetch one from endpoint
  useEffect(() => {
    if (!topicFromQuery) {
      const fetchTopic = async () => {
        try {
          setIsLoadingTopic(true);
          const response = await axios.get("/api/v1/generate-topic");
          if (response.data && response.data.topic) {
            setTopic(response.data.topic);
            if (response.data.keywords && response.data.keywords.length > 0) {
              setKeywords(response.data.keywords);
            }
          }
        } catch (error) {
          console.error("Error fetching topic:", error);
          // Keep default topic and keywords
        } finally {
          setIsLoadingTopic(false);
        }
      };

      fetchTopic();
    }
  }, [topicFromQuery]);

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
    setSelectedFile(null); // Clear any selected file when starting to record
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Check if the file is a video
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
        // Clear any recorded video when a file is selected
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach((track) => track.stop());
        }
      } else {
        toast.error("Please select a valid video file");
        event.target.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!mediaBlobUrl && !selectedFile) {
      toast.error("No video to upload!");
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      let blob: Blob;
      
      if (selectedFile) {
        // Use the selected file directly
        blob = selectedFile;
      } else {
        // Convert blob URL into an actual Blob
        blob = await fetch(mediaBlobUrl).then((res) => res.blob());
      }
      
      const formData = new FormData();
      formData.append("file", blob, selectedFile ? selectedFile.name : "video.mp4");
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
      await axios.post("/api/v1/video/save", { videoUrl, topic });
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
      <header className="w-full bg-black bg-opacity-60 backdrop-blur-lg p-4 shadow-lg fixed top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">VOCA Video Recorder</h1>
          <nav className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-300 transition">Home</a>
            <a href="/about" className="hover:text-blue-300 transition">About</a>
            <a href="/contact" className="hover:text-blue-300 transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-8">
        {/* Topic Title Section */}
        <div className="text-center mb-6 animate-fadeIn">
          <div className="inline-block bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-3 rounded-lg shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-1">
              {isLoadingTopic ? "Loading topic..." : topic}
            </h2>
            <div className="h-0.5 w-16 bg-blue-400 mx-auto mt-1"></div>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm font-semibold">Status: {status}</p>
          {isRecording && <p className="text-xs mt-1">Recording Time: {recordingTime}s</p>}
        </div>
        
        {/* Enhanced Video Section - Enlarged Recording Area */}
        <div className="flex justify-center">
          <div className="relative bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl">
            {isRecording && (
              <div className="absolute top-2 left-2 flex items-center space-x-2 z-10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-semibold bg-black bg-opacity-50 px-2 py-0.5 rounded">
                  Recording {recordingTime}s
                </span>
              </div>
            )}
            {isRecording ? (
              <video ref={videoRef} autoPlay className="w-full object-cover h-[600px]" />
            ) : mediaBlobUrl ? (
              <video src={mediaBlobUrl} controls className="w-full object-cover h-[600px]" />
            ) : selectedFile ? (
              <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg mb-1">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">File selected from computer</p>
              </div>
            ) : (
              <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg mb-1">No video selected</p>
                <p className="text-xs text-gray-400">Record a video or select one from your computer</p>
              </div>
            )}
            
            {/* Keywords Section */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 backdrop-blur-sm p-2">
              <div className="flex flex-wrap justify-center gap-1.5">
                <span className="font-bold text-blue-300 text-xs mr-1">Keywords:</span>
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-0.5 bg-blue-600 bg-opacity-50 rounded-full text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload and Recording Controls */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {/* File upload input (hidden) */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          
          {/* Recording Controls */}
          <div className="flex flex-wrap justify-center gap-4">
            {!isRecording && !mediaBlobUrl && !selectedFile && (
              <>
                <button
                  onClick={handleStartRecording}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Record Video
                  </div>
                </button>
                
                <button
                  onClick={triggerFileInput}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload from PC
                  </div>
                </button>
              </>
            )}
            
            {isRecording && (
              <button
                onClick={handleStopRecording}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Recording
                </div>
              </button>
            )}
            
            {(mediaBlobUrl || selectedFile) && !isRecording && !isUploaded && (
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium disabled:opacity-50"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {isUploading ? "Uploading..." : "Upload Video"}
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-5 py-2 bg-gray-600 hover:bg-gray-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="w-full max-w-md mt-4 mx-auto">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-1 text-center text-xs">{uploadProgress}%</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />     

      {/* Modal Popup */}
      {showPopup && (
        <UploadPopup videoUrl={uploadedVideoUrl} onClose={handleClosePopup} onViewReport={handleViewReport} />
      )}
    </div>
  );
};

export default RecordingPage;
