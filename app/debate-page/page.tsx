"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import HeroSection from "../components/hero-section";
import Footer from "../components/footer";

// Upload Popup Component (appears only after a successful video upload)
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
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition text-sm"
          >
            Close
          </button>
          <button
            onClick={onViewReport}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm"
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};

const DebatePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Use backend URL from env or default
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Debate session state
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>("Loading debate topic...");
  const [isLoadingTopic, setIsLoadingTopic] = useState<boolean>(true);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState<string[]>([]);
  const [currentAiResponse, setCurrentAiResponse] = useState<string>("");
  const [showAiResponse, setShowAiResponse] = useState<boolean>(false);

  // Video recording & upload states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  // Debate timer (5 minutes)
  const debateDuration = 300; // seconds
  const [timeRemaining, setTimeRemaining] = useState<number>(debateDuration);

  // Video recording hook (for debate video)
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    video: true,
    audio: true,
  });

  // Voice recording hook (audio only; no playback to avoid echo)
  const {
    startRecording: startSpeaking,
    stopRecording: stopSpeaking,
    mediaBlobUrl: speakingMediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
  });
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // ------------------ FETCH TOPIC & START DEBATE ------------------
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setIsLoadingTopic(true);
        const response = await axios.get(`${backendURL}/start`);
        if (response.data && response.data.topic) {
          setTopic(response.data.topic);
        } else {
          setTopic("Is technology improving or harming education?");
        }
        setIsDebateActive(true);
      } catch (error) {
        console.error("Error fetching topic:", error);
        setTopic("Is technology improving or harming education?");
        setIsDebateActive(true);
      } finally {
        setIsLoadingTopic(false);
      }
    };
    fetchTopic();
  }, [backendURL]);

  // ------------------ TIMER UPDATE ------------------
  useEffect(() => {
    if (!isDebateActive) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isDebateActive]);

  // ------------------ VIDEO RECORDING FUNCTIONS ------------------
  const getStream = async () => {
    try {
      // Enable echo cancellation for better audio quality
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
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
    setSelectedFile(null);
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

  // ------------------ FILE SELECTION & UPLOAD ------------------
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
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
    fileInputRef.current?.click();
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
        blob = selectedFile;
      } else {
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
      setUploadedVideoUrl(videoUrl);
      setShowPopup(true); // Show popup only after successful upload
      // Optionally, send video URL and topic to your backend for saving
      await axios.post("/api/v1/video/save", { videoUrl, topic });
      setIsUploading(false);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload video.");
      setIsUploading(false);
    }
  };

  const handleClosePopup = () => setShowPopup(false);

  // ------------------ VOICE (SPEECH) RECORDING FUNCTIONS ------------------
  // Record audio-only input (without playback to avoid echo)
  const handleToggleSpeaking = async () => {
    if (!isSpeaking) {
      setIsSpeaking(true);
      startSpeaking();
    } else {
      setIsSpeaking(false);
      stopSpeaking();
      processSpokenAudio();
    }
  };

  const processSpokenAudio = async () => {
    if (!speakingMediaBlobUrl) {
      toast.error("No speech captured. Please try again.");
      return;
    }
    try {
      const audioBlob = await fetch(speakingMediaBlobUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("audio_file", audioBlob, "argument.wav");
      const response = await axios.post(`${backendURL}/process`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data && response.data.ai_response) {
        const aiResponse = response.data.ai_response;
        setCurrentAiResponse(aiResponse);
        setAiResponses((prev) => [...prev, aiResponse]);
      } else {
        toast.error("Failed to get AI response.");
      }
    } catch (error) {
      console.error("Error processing spoken audio:", error);
      toast.error("Error processing your speech. Please try again.");
    }
  };

  // ------------------ CANCEL DEBATE ------------------
  const handleCancelDebate = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    if (isRecording) {
      handleStopRecording();
    }
    setIsDebateActive(false);
    toast.info("Debate cancelled. You can still view your final report.");
  };

  // ------------------ CONTINUE DEBATE (simulate adding a user point) ------------------
  const continueDebate = async () => {
    const newPoint = "User continued the debate"; // Replace with actual recognized text if available
    setUserPoints((prev) => [...prev, newPoint]);
    try {
      const formData = new FormData();
      formData.append("text", newPoint);
      const response = await axios.post(`${backendURL}/process`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data && response.data.ai_response) {
        const aiResponse = response.data.ai_response;
        setCurrentAiResponse(aiResponse);
        setAiResponses((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Timer at top right */}
      {isDebateActive && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-75 px-4 py-2 rounded-lg shadow-lg">
          <span className="text-lg font-bold">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Header */}
      <HeroSection />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-8">
        {/* Debate Topic */}
        <div className="text-center mb-6 animate-fadeIn">
          <div className="inline-block bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-3 rounded-lg shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-1">
              {isLoadingTopic ? "Loading debate topic..." : topic}
            </h2>
            <div className="h-0.5 w-16 bg-blue-400 mx-auto mt-1"></div>
          </div>
        </div>

        {/* Cancel Debate Button */}
        {isDebateActive && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCancelDebate}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition"
            >
              Cancel Debate
            </button>
          </div>
        )}

        {/* Video Recording Area */}
        <div className="flex justify-center">
          <div className="relative bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl">
            {status === "recording" ? (
              <video ref={videoRef} autoPlay className="w-full object-cover h-[500px]" />
            ) : mediaBlobUrl ? (
              <video src={mediaBlobUrl} controls className="w-full object-cover h-[500px]" />
            ) : selectedFile ? (
              <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg mb-1">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">File selected from computer</p>
              </div>
            ) : (
              <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg mb-1">No video selected</p>
                <p className="text-xs text-gray-400">Record your debate or select a video from your computer</p>
              </div>
            )}

            {/* AI Response Overlay */}
            {showAiResponse && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-sm p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-bold text-green-400 text-sm">AI Response:</span>
                  </div>
                  <p className="text-white text-sm italic">{currentAiResponse}</p>
                  <div className="flex justify-end">
                    <button
                      onClick={continueDebate}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-medium transition"
                    >
                      Continue Debate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          {/* Video Recording Controls */}
          <div className="flex flex-col items-center gap-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
              >
                Start Debate Video
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
              >
                Stop Debate Video
              </button>
            )}
            <button
              onClick={triggerFileInput}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
            >
              Upload Debate Video
            </button>
          </div>

          {/* Voice (Speech) Recording Controls */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleToggleSpeaking}
              className={`px-5 py-2 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium ${
                isSpeaking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSpeaking ? "Stop Speaking" : "Start Speaking"}
            </button>
          </div>
        </div>

        {/* Upload Progress Bar */}
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

        {/* Debate History Section */}
        {aiResponses.length > 0 && (
          <div className="mt-8 w-full max-w-4xl mx-auto bg-gray-800 bg-opacity-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-300">Debate History</h3>
            <div className="space-y-3">
              {aiResponses.map((response, index) => (
                <div key={index} className="p-3 bg-gray-700 bg-opacity-50 rounded">
                  <p className="text-xs font-semibold text-green-400">AI Response {index + 1}:</p>
                  <p className="text-sm mt-1">{response}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Upload Popup: Renders only after a successful upload */}
      {showPopup && uploadedVideoUrl && (
        <UploadPopup
          videoUrl={uploadedVideoUrl}
          onClose={handleClosePopup}
          onViewReport={() => router.push("/report")}
        />
      )}
    </div>
  );
};

export default DebatePage;
