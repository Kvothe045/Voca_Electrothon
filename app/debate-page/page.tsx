"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "../components/hero-section";
import Footer from "../components/footer";
import { debateService } from "../lib/debateService";
// import { VoskRecognizer } from "vosk-browser";
import { recognizeSpeechVosk } from "../lib/recognizeSpeechVosk";

// Ensure you have your Vosk model available at this URL.
const MODEL_URL = "/vosk-model-small-en-us-0.15";

export default function DebatePage() {
  const [topic, setTopic] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [timer, setTimer] = useState<number>(180);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  const router = useRouter();
  const webSocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Added missing reference
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gemini configuration will be embedded in the system instruction (no extra 'language' field)
  const systemInstruction = `You are participating in a formal debate on the topic: "${topic}".
Your role is to be a respectful but challenging debate opponent.
Present strong arguments and counter the user's points with thoughtful responses.
Keep responses concise (15-30 seconds when spoken).
Use English for all responses.`;

  // Initialize debate session
  const initializeDebate = async () => {
    const newSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);
    const randomTopic = await debateService.getRandomTopic();
    setTopic(randomTopic);

    try {
      const socketUrl = `ws://localhost:8000/debate/${newSessionId}`;
      const socket = new WebSocket(socketUrl);
      webSocketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setIsDebating(true);
        startTimer();
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
    }
  };

  // Handle WebSocket messages from backend
  const handleWebSocketMessage = (data: any) => {
    switch (data.event) {
      case "debate_started":
        setTopic(data.topic);
        break;
      case "ai_text":
        setAiResponse((prev) => prev + data.text);
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "AI") {
            return [...prev.slice(0, -1), { role: "AI", text: last.text + data.text }];
          }
          return [...prev, { role: "AI", text: data.text }];
        });
        break;
      case "ai_audio":
        // Optionally, implement audio playback here.
        break;
      case "debate_ended":
        setIsEnded(true);
        setIsDebating(false);
        clearInterval(timerIntervalRef.current!);
        break;
      case "error":
        console.error("Error from server:", data.message);
        break;
      default:
        console.log("Unknown event:", data);
    }
  };

  // Start recording user audio with MediaRecorder using MIME type "audio/webm"
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: options.mimeType });
        sendAudio(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const recognizeSpeech = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        // Fallback: prompt user to enter text manually
        const typed = window.prompt(
          "Speech Recognition API is not supported in your browser. Please type your message:"
        );
        if (typed !== null && typed.trim() !== "") {
          resolve(typed);
        } else {
          reject(new Error("No input provided."));
        }
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      recognition.onerror = (err: any) => reject(err);
      recognition.start();
    });
  };
  


// Inside your DebatePage component:
const stopRecording = async () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    console.log("Recording stopped");

    // Create blob with MIME type "audio/webm"
    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    
    try {
      const recognizedText = await recognizeSpeechVosk(blob);
      console.log("Recognized text:", recognizedText);
      // Send the recognized text to backend via WebSocket.
      if (webSocketRef.current) {
        webSocketRef.current.send(
          JSON.stringify({
            event: "user_audio",
            user_text: recognizedText,
          })
        );
      }
    } catch (error) {
      console.error("Speech recognition failed:", error);
    }
  }
};


  
  // Convert audio blob to base64 and send to backend
  const sendAudio = (blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Audio = result.split(",")[1];
      if (webSocketRef.current) {
        webSocketRef.current.send(
          JSON.stringify({
            event: "user_audio",
            audio: base64Audio,
          })
        );
      }
    };
    reader.readAsDataURL(blob);
  };

  // Timer logic
  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          endDebate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endDebate = () => {
    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({ event: "end_debate" }));
    }
    setIsEnded(true);
    setIsDebating(false);
    clearInterval(timerIntervalRef.current!);
  };

  // For demo purposes: simulate sending a sample user message (voice-to-text conversion)
  const handleSendDummyMessage = () => {
    const sampleText = "This is a sample spoken message.";
    setTranscript((prev) => [...prev, { role: "USER", text: sampleText }]);
    if (webSocketRef.current) {
      webSocketRef.current.send(
        JSON.stringify({
          event: "user_audio",
          user_text: sampleText,
        })
      );
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (webSocketRef.current) webSocketRef.current.close();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <HeroSection />
      <main className="container mx-auto px-6 pt-32 pb-12 space-y-8">
        <h1 className="text-4xl font-bold text-center animate-fadeIn">AI Debate Arena 🤖</h1>
        {!isConnected && !isDebating && !isEnded && (
          <div className="text-center animate-fadeIn">
            <p className="text-lg mb-4">Ready to challenge your debating skills?</p>
            <button
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-2xl transition transform hover:scale-105"
              onClick={initializeDebate}
            >
              Start Debate
            </button>
          </div>
        )}
        {isDebating && (
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-2">💬</span>
                <h2 className="text-2xl font-bold">Topic: {topic}</h2>
              </div>
              <div className="text-xl font-bold">Time: {formatTime(timer)}</div>
            </div>
            <div className="h-64 overflow-y-auto bg-gray-700 bg-opacity-60 rounded-xl p-4 mb-4 shadow-inner">
              {transcript.map((entry, index) => (
                <div key={index} className="mb-2">
                  <span className="font-bold">
                    {entry.role === "AI" ? "🤖 AI:" : "🧑 You:"}
                  </span>{" "}
                  {entry.text}
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <button
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-2xl shadow-2xl transition transform hover:scale-105"
                  onClick={startRecording}
                >
                  Start Speaking 🎤
                </button>
              ) : (
                <button
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-2xl shadow-2xl transition transform hover:scale-105"
                  onClick={stopRecording}
                >
                  Stop Speaking ✋
                </button>
              )}
              <button
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-2xl shadow-2xl transition transform hover:scale-105"
                onClick={endDebate}
              >
                End Debate
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-700 transition"
                onClick={handleSendDummyMessage}
              >
                Send Sample Message
              </button>
            </div>
          </div>
        )}
        {isEnded && (
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl animate-fadeIn text-center">
            <h2 className="text-3xl font-bold mb-4">Debate Ended</h2>
            <div className="mb-4">
              <h3 className="text-xl font-bold">Transcript</h3>
              <div className="mt-2 text-left max-h-64 overflow-y-auto bg-gray-700 bg-opacity-60 rounded-xl p-4 shadow-inner">
                {transcript.map((entry, index) => (
                  <p key={index} className="mb-1">
                    <strong>{entry.role === "AI" ? "🤖 AI:" : "🧑 You:"}</strong> {entry.text}
                  </p>
                ))}
              </div>
            </div>
            <button
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-2xl transition transform hover:scale-105"
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// export default DebatePage;
