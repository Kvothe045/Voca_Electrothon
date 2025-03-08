"use client";

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "../components/footer";
import HeroSection from "../components/hero-section";
import { resources } from "../api/resources"; // Adjust path if needed

// Custom hook to safely use react-media-recorder.
function useSafeReactMediaRecorder(config: any) {
  if (typeof window !== "undefined" && window.Worker) {
    const { useReactMediaRecorder } = require("react-media-recorder");
    return useReactMediaRecorder(config);
  } else {
    return {
      status: "idle",
      startRecording: () => {},
      stopRecording: () => {},
      mediaBlobUrl: null,
    };
  }
}

// Modal Popup Component.
interface UploadPopupProps {
  videoUrl: string;
  onClose: () => void;
  onViewReport: () => void;
}

const UploadPopup: React.FC<UploadPopupProps> = ({ videoUrl, onClose, onViewReport }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl shadow-2xl transition-all duration-500">
        <h2 className="text-2xl font-bold mb-3 text-gray-800">Upload Successful!</h2>
        <p className="mb-3 text-gray-600">Your video has been uploaded successfully.</p>
        <p className="mb-3 break-all text-gray-700 text-sm">
          <span className="font-semibold">URL:</span>{" "}
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {videoUrl}
          </a>
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm">
            Close
          </button>
          <button onClick={onViewReport} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
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

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [topic, setTopic] = useState<string>(topicFromQuery || "AI: Boon or Bane?");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoadingTopic, setIsLoadingTopic] = useState<boolean>(!topicFromQuery);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showKeywords, setShowKeywords] = useState<boolean>(false);

  // Use safe react-media-recorder hook.
  const { status, startRecording, stopRecording, mediaBlobUrl } = useSafeReactMediaRecorder({
    video: true,
    audio: true,
  });

  useEffect(() => {
    if (!topicFromQuery) {
      const fetchTopic = async () => {
        try {
          setIsLoadingTopic(true);
          const response = await axios.get("/api/v1/generate-topic");
          if (response.data && response.data.topic) {
            setTopic(response.data.topic);
          }
        } catch (error) {
          console.error("Error fetching topic:", error);
        } finally {
          setIsLoadingTopic(false);
        }
      };
      fetchTopic();
    }
  }, [topicFromQuery]);

  useEffect(() => {
    if (topic) {
      const matchedResource = resources.find(
        (res) => res.title.toLowerCase() === topic.toLowerCase()
      );
      setKeywords(matchedResource ? matchedResource.keywords : []);
      setShowKeywords(false);
    }
  }, [topic]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const getStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access is not available. Use HTTPS and a supported browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media stream:", error);
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
        blob = await fetch(mediaBlobUrl as string).then((res) => res.blob());
      }

      // Upload video to Cloudinary.
      const formData = new FormData();
      formData.append("file", blob, selectedFile ? selectedFile.name : "video.mp4");
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const cloudinaryResponse = await axios.post(
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

      const videoUrl = cloudinaryResponse.data.secure_url;
      toast.success("Video Uploaded Successfully!");
      setIsUploaded(true);
      setUploadedVideoUrl(videoUrl);
      setShowPopup(true);

      // Prepare payload for the analysis endpoint.
      const analysisPayload = {
        verificationHash:
          "8214fb8d89789cb42c3aaa797d92db4865b696d01ea36f93835f2208a8f5fbb2760376d0fc8653f4d68b5a49e0cdb263f418529c028970eb1385d951197005e8",
        reportID: "83921234",
        activityName: topic,
        videoID: "57284921",
        videoLink: videoUrl,
      };

      console.log("Sending POST request to video analysis endpoint with payload:", analysisPayload);

      // Send the analysis request.
      const analysisResponse = await axios.post(
        "http://192.168.42.175:8000/api/videoanalysis",
        analysisPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Video Analysis Response:", analysisResponse.data);
      toast.info("Analysis Response: " + JSON.stringify(analysisResponse.data));

      // Start long polling GET request for the JSON report.
      console.log("Starting long polling GET request for video JSON...");
      const videoJsonResponse = await axios.get("http://192.168.42.175:8000/api/videojson/", {
        headers: { Accept: "application/json" },
        timeout: 0, // Wait indefinitely until the JSON is available.
      });
      console.log("Video JSON Response:", videoJsonResponse.data);
      toast.success("Video JSON Analysis received!");

      // Store the JSON report in localStorage.
      localStorage.setItem("videoReport", JSON.stringify(videoJsonResponse.data));

      // Redirect to the report page.
      router.push("/report-page");
    } catch (error) {
      console.error("Error during video upload/analysis:", error);
      toast.error("Failed to upload video or complete analysis.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClosePopup = () => setShowPopup(false);
  const handleViewReport = () => {
    setShowPopup(false);
    router.push("/report-page");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Header */}
      <HeroSection />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-8">
        <div className="text-center mb-6 animate-fadeIn">
          <div className="inline-block bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-3 rounded-lg shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-1">{isLoadingTopic ? "Loading topic..." : topic}</h2>
            <div className="h-0.5 w-16 bg-blue-400 mx-auto mt-1"></div>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm font-semibold">Status: {status}</p>
          {isRecording && <p className="text-xs mt-1">Recording Time: {recordingTime}s</p>}
        </div>

        {/* Video Preview Section */}
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
              <video src={mediaBlobUrl as string} controls className="w-full object-cover h-[600px]" />
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

            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 backdrop-blur-sm p-4">
              {showKeywords ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="font-bold text-blue-300 text-sm mr-2">Keywords:</span>
                  {keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-600 bg-opacity-50 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center">
                  <button onClick={() => setShowKeywords(true)} className="text-green-500 text-xl font-bold">
                    Get Keywords
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload & Recording Controls */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" className="hidden" />
          {!isRecording && !mediaBlobUrl && !selectedFile && (
            <>
              <button
                onClick={handleStartRecording}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-full shadow-lg transition transform hover:scale-105 text-sm font-medium"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4" />
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
                onClick={() => window.location.reload()}
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
      {showPopup && <UploadPopup videoUrl={uploadedVideoUrl} onClose={handleClosePopup} onViewReport={handleViewReport} />}
    </div>
  );
};

export default RecordingPage;
