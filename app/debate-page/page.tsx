"use client";
// frontend/next-app/pages/debate.tsx
import { useState, useEffect, useRef } from "react";

const DebatePage = () => {
  const [status, setStatus] = useState("Ready to start debate");
  const [timerText, setTimerText] = useState("Time remaining: 5:00");
  const [debateActive, setDebateActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [topic, setTopic] = useState("");
  const timerIntervalRef = useRef<number | null>(null);
  const debateEndTimeRef = useRef<Date | null>(null);

  // Start the debate by calling the backend endpoint.
  const startDebate = async () => {
    const res = await fetch("http://localhost:8000/start-debate", {
      method: "POST",
    });
    const data = await res.json();
    if (data.topic) {
      setTopic(data.topic);
      setStatus("Debate started: " + data.topic);
      setDebateActive(true);
      debateEndTimeRef.current = new Date(data.debateEndTime);
      timerIntervalRef.current = window.setInterval(updateTimer, 500);
    } else {
      setStatus("Error starting debate");
    }
  };

  const updateTimer = () => {
    if (debateEndTimeRef.current) {
      const now = new Date();
      const diff = debateEndTimeRef.current.getTime() - now.getTime();
      if (diff > 0) {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimerText(`Time remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else {
        setTimerText("Time's up!");
        endDebate();
      }
    }
  };

  // Start recording using MediaRecorder.
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Audio recording not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        setAudioChunks(chunks);
        const blob = new Blob(chunks, { type: "audio/wav" });
        processAudio(blob);
      };
      recorder.start();
      setRecording(true);
      setStatus("Recording...");
    } catch (e) {
      setStatus("Error starting recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      setStatus("Processing audio...");
    }
  };

  // Send the recorded audio file to the backend.
  const processAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    const res = await fetch("http://localhost:8000/process-audio", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.error) {
      setStatus(data.error);
    } else {
      setStatus("AI Response: " + data.aiResponse);
      // If TTS audio is returned (Base64-encoded), play it.
      if (data.ttsAudio) {
        const audio = new Audio("data:audio/wav;base64," + data.ttsAudio);
        audio.play();
      }
    }
  };

  const endDebate = async () => {
    if (!debateActive) return;
    const res = await fetch("http://localhost:8000/end-debate", {
      method: "POST",
    });
    const data = await res.json();
    setStatus("Final Report: " + data.report);
    if (data.ttsAudio) {
      const audio = new Audio("data:audio/wav;base64," + data.ttsAudio);
      audio.play();
    }
    setDebateActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>VOCA AI Debate Program</h1>
      <p style={styles.status}>{status}</p>
      <p style={styles.timer}>{timerText}</p>
      <button
        style={styles.button}
        onClick={() => {
          if (!recording) startRecording();
          else stopRecording();
        }}
        disabled={!debateActive}
      >
        {recording ? "RELEASE TO STOP" : "PRESS TO TALK"}
      </button>
      <button style={{ ...styles.button, backgroundColor: "#f44336" }} onClick={endDebate} disabled={!debateActive}>
        End Debate
      </button>
      <button style={{ ...styles.button, backgroundColor: "#2196F3" }} onClick={startDebate} disabled={debateActive}>
        Start Debate
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f0f0f0",
    textAlign: "center",
    borderRadius: "8px",
    marginTop: "50px",
  },
  title: {
    fontFamily: "Arial, sans-serif",
    fontWeight: "bold",
    fontSize: "20px",
    marginBottom: "10px",
  },
  status: {
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    marginBottom: "5px",
  },
  timer: {
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    marginBottom: "20px",
  },
  button: {
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    margin: "10px 5px",
    cursor: "pointer",
  },
};

export default DebatePage;
