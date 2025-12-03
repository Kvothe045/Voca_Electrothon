'use client';
import 'regenerator-runtime/runtime';
import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Bot, User, Clock, Plus, Download, FileText, XCircle, Upload, RefreshCcw } from 'lucide-react';
import { jsPDF } from 'jspdf';

const SILENCE_THRESHOLD = 10; // 10 Seconds for thinking

export default function InterviewPage() {
  const [step, setStep] = useState(1);
  const [jd, setJd] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState('');

  // Settings
  const [selectedDuration, setSelectedDuration] = useState(15);

  // Timers
  const [globalTime, setGlobalTime] = useState(0);
  const [silenceTime, setSilenceTime] = useState(SILENCE_THRESHOLD);

  // State
  const [transcriptData, setTranscriptData] = useState<{sender:string, text:string}[]>([]);
  const [status, setStatus] = useState<'Idle' | 'Listening' | 'Speaking' | 'Processing' | 'Completed' | 'Feedback'>('Idle');
  const [feedback, setFeedback] = useState('');

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const globalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const transcriptRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const liveTextEndRef = useRef<HTMLSpanElement | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Sync ref
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Auto-scrolls
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptData]);

  useEffect(() => {
    liveTextEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // --- STEP 1: UPLOAD ---
  const handleStart = async () => {
    if (!browserSupportsSpeechRecognition) return alert("Please use Chrome/Edge.");
    if (!jd) return alert("Please enter a Job Description");

    try {
      const formData = new FormData();
      formData.append('jd', jd);
      if (resumeFile) formData.append('resume', resumeFile);

      const res = await fetch('https://interviewbackend-il43.onrender.com/upload-context', { method: 'POST', body: formData });
      const data = await res.json();
      setSessionId(data.session_id);

      setGlobalTime(selectedDuration * 60);
      setStep(2);
    } catch (err) {
      alert("Backend connection failed.");
    }
  };

  // --- STEP 2: WEBSOCKET ---
  useEffect(() => {
    if (step === 2 && sessionId) {
      globalIntervalRef.current = setInterval(() => {
        setGlobalTime(prev => {
          if (prev <= 1) {
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const ws = new WebSocket(`https://interviewbackend-il43.onrender.com/ws/interview/${sessionId}`);

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'feedback') {
          setFeedback(data.text);
          setStatus('Feedback');
          stopGlobalTimer();
          ws.close();
          return;
        }

        if (data.text && data.type !== 'feedback') {
          setTranscriptData(prev => [...prev, { sender: 'AI', text: data.text }]);
        }

        if (data.type === 'audio') {
          setStatus('Speaking');
          playAudio(data.data);
        }
      };

      socketRef.current = ws;
      return () => {
        ws.close();
        stopGlobalTimer();
      };
    }
  }, [step, sessionId]);

  const stopGlobalTimer = () => {
    if(globalIntervalRef.current) clearInterval(globalIntervalRef.current);
  };

    const handleEndInterview = () => {
      stopGlobalTimer();
      SpeechRecognition.stopListening();
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({ text: "END_INTERVIEW_NOW", type: "time_up" }));
      }
    };

    // --- AUDIO & LISTENING ---
    const playAudio = (base64Audio: string) => {
      SpeechRecognition.stopListening();
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      const url = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => startListeningCycle();
      }
    };

    const startListeningCycle = () => {
      if(status === 'Completed' || status === 'Feedback') return;

      resetTranscript();
      transcriptRef.current = '';
      setStatus('Listening');
      setSilenceTime(SILENCE_THRESHOLD);

      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });

      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = setInterval(() => {
        setSilenceTime(prev => prev - 1);
      }, 1000);
    };

    useEffect(() => {
      if (status === 'Listening' && silenceTime === 0) {
        handleSilenceTimeout();
      }
    }, [silenceTime, status]);

    useEffect(() => {
      if (listening && transcript.length > 0) {
        setSilenceTime(SILENCE_THRESHOLD);
      }
    }, [transcript, listening]);

    const handleSilenceTimeout = () => {
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
      SpeechRecognition.stopListening();

      const finalTranscript = transcriptRef.current;

      if (finalTranscript.trim().length > 0) {
        handleUserResponse(finalTranscript);
      } else {
        setStatus('Processing');
        setTranscriptData(prev => [...prev, { sender: 'System', text: 'No response detected...' }]);
        if (socketRef.current) socketRef.current.send(JSON.stringify({ text: '', type: 'silence_timeout' }));
      }
    };

    const handleUserResponse = (text: string) => {
      if(!text) return;
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

      setStatus('Processing');
      setTranscriptData(prev => [...prev, { sender: 'User', text: text }]);
      resetTranscript();
      transcriptRef.current = '';

      if (socketRef.current) socketRef.current.send(JSON.stringify({ text, type: 'answer' }));
    };

    // --- UI HELPERS ---
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const downloadPDF = () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = pageWidth - margin * 2;
      let yPosition = 20;

      doc.setFontSize(22);
      doc.setTextColor(40, 40, 255);
      doc.text("Interview Feedback Report", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const textLines = doc.splitTextToSize(feedback, maxLineWidth);

      textLines.forEach((line: string) => {
        if (yPosition + 10 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      doc.save("Interview_Feedback.pdf");
    };

    function base64ToBlob(base64: string, mime: string) {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mime });
    }

    // --- RENDER ---
    if (!browserSupportsSpeechRecognition && step === 1) return <div>Use Chrome.</div>;

    return (
      <div className="h-screen bg-gray-950 text-gray-100 font-sans flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="h-16 flex-none bg-gray-900 border-b border-gray-800 px-6 flex justify-between items-center shadow-lg z-50">
      <div className="flex items-center gap-2">
      <Bot className="text-blue-500" />
      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
      AI Recruiter Pro
      </h1>
      </div>
      {step === 2 && (
        <div className="flex items-center gap-4">
        {/* END BUTTON */}
        {status !== 'Feedback' && (
          <button
          onClick={handleEndInterview}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors mr-4"
          >
          <XCircle size={16} /> End Interview
          </button>
        )}

        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
        <Clock size={18} className="text-blue-400 animate-pulse" />
        <span className={`font-mono text-xl font-bold ${globalTime < 60 ? 'text-red-500' : 'text-white'}`}>
        {formatTime(globalTime)}
        </span>
        </div>
        <button
        onClick={() => setGlobalTime(t => t + 120)}
        className="flex items-center gap-1 text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-3 py-1.5 rounded-lg border border-blue-800"
        >
        <Plus size={14}/> 2 Mins
        </button>
        </div>
      )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-hidden">
      {step === 1 && (
        <div className="max-w-xl mx-auto mt-10 space-y-6 bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-6">
        <FileText size={48} className="mx-auto text-blue-500 mb-4"/>
        <h2 className="text-2xl font-bold">Setup Interview</h2>
        </div>

        <textarea
        placeholder="Paste Job Description (JD)..."
        className="w-full p-4 bg-gray-950 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-all"
        rows={4}
        onChange={(e) => setJd(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
        {/* CUSTOM UPLOAD RESUME BUTTON */}
        <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer group h-32">
        <input
        type="file"
        accept=".pdf"
        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <Upload className="text-gray-400 mb-2 group-hover:text-blue-400 transition-colors" size={24} />
        <span className="text-gray-400 text-sm group-hover:text-white font-medium text-center px-2">
        {resumeFile ? resumeFile.name : "Upload Resume (PDF)"}
        </span>
        </div>

        <div className="relative h-32">
        <label className="block text-gray-400 text-xs uppercase font-bold mb-2">Duration</label>
        <select
        value={selectedDuration}
        onChange={(e) => setSelectedDuration(Number(e.target.value))}
        className="w-full p-3 bg-gray-950 rounded-lg border border-gray-700 text-white focus:border-blue-500 h-[calc(100%-2rem)]"
        >
        <option value={5}>5 Minutes</option>
        <option value={10}>10 Minutes</option>
        <option value={15}>15 Minutes</option>
        <option value={30}>30 Minutes</option>
        </select>
        </div>
        </div>

        <button onClick={handleStart} className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
        Start Interview
        </button>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

        {/* LEFT: AVATAR & CONTROLS */}
        <div className="flex flex-col h-full bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">

        {status === 'Feedback' ? (
          <div className="flex flex-col h-full p-8">
          <div className="flex justify-between items-center mb-6 flex-none">
          <h2 className="text-3xl font-bold text-green-400">Feedback</h2>
          <div className="flex gap-2">
          <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-500 transition-colors">
          <Download size={18}/> PDF
          </button>
          {/* NEW: RESTART BUTTON */}
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-500 transition-colors">
          <RefreshCcw size={18}/> Start New
          </button>
          </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
          {feedback}
          </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between h-full p-8">
          <div className="h-16 flex justify-center items-center w-full flex-none">
          {status === 'Listening' && (
            <div className="flex items-center gap-4 bg-gray-800/80 px-6 py-2 rounded-full border border-gray-700 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
            <span className="text-gray-400 text-sm font-bold uppercase">Thinking</span>
            <div className={`font-mono text-2xl font-bold ${silenceTime <= 3 ? 'text-red-500' : 'text-white'}`}>
            {silenceTime}s
            </div>
            <button onClick={() => setSilenceTime(t => t + 10)} className="hover:bg-gray-700 rounded-full text-blue-400 p-1"><Plus size={20}/></button>
            </div>
          )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
          <div className={`w-48 h-48 rounded-full flex items-center justify-center mb-6 transition-all duration-500 relative z-10 flex-none ${
            status === 'Listening' ? 'bg-red-500/10 border-4 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]' :
            status === 'Speaking' ? 'bg-blue-600/10 border-4 border-blue-500 scale-110 shadow-[0_0_60px_rgba(37,99,235,0.4)]' :
            'bg-gray-800 border-4 border-gray-700'
          }`}>
          {status === 'Speaking' && <Bot size={80} className="text-blue-400 animate-pulse" />}
          {status === 'Listening' && <User size={80} className="text-red-400" />}
          {(status === 'Processing' || status === 'Idle') && <Bot size={80} className="text-gray-600" />}
          </div>

          <h2 className="text-2xl font-bold text-gray-200 flex-none">{status}</h2>

          <div className="w-full mt-4 h-24 overflow-y-auto bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50 relative">
          <p className="text-gray-300 text-sm leading-relaxed">
          {listening ? (
            <>
            <span className="italic">"{transcript}"</span>
            <span ref={liveTextEndRef}></span>
            </>
          ) : (
            <span className="text-gray-500">...</span>
          )}
          </p>
          </div>
          </div>

          <div className="w-full flex items-center justify-center gap-1 h-8 flex-none mt-4">
          {status === 'Speaking' && [1,2,3,4,5].map(i => (
            <div key={i} className="w-1.5 bg-blue-500 rounded-full animate-bounce" style={{height: '20px', animationDelay: `${i*0.1}s`}}></div>
          ))}
          </div>
          </div>
        )}
        <audio ref={audioRef} className="hidden" />
        </div>

        {/* RIGHT: TRANSCRIPT */}
        <div className="flex flex-col h-full bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="flex-none p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur z-10">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Transcript History</h3>
        <span className="flex items-center gap-2 text-xs text-green-400"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {transcriptData.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'AI' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2`}>
          {msg.sender === 'AI' && <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mr-2 flex-shrink-0"><Bot size={14} className="text-blue-400"/></div>}

          <div className={`px-4 py-3 max-w-[85%] rounded-2xl text-sm leading-relaxed ${
            msg.sender === 'AI' ? 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700' :
            msg.sender === 'System' ? 'bg-red-900/20 text-red-300 border border-red-800 text-center w-full italic' :
            'bg-blue-600 text-white rounded-tr-none shadow-lg'
          }`}>
          {msg.text}
          </div>
          </div>
        ))}
        <div ref={transcriptEndRef} />
        </div>
        </div>
        </div>
      )}
      </div>
      </div>
    );
}
