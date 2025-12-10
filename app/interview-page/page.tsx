'use client';
import 'regenerator-runtime/runtime';
import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Bot, User, Clock, Plus, Download, FileText, XCircle, Upload, RefreshCcw, Loader2, Wifi, Server, Coffee, Zap, Sparkles, BrainCircuit, AlertTriangle, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

const SILENCE_THRESHOLD = 10; // 10 Seconds

// --- URL SANITIZER ---
const cleanBackendUrl = (url: string | undefined) => {
    if (!url) return 'http://localhost:8000'; 
    return url.replace(/\/+$/, ''); 
};

const BACKEND_URL = cleanBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL);

// WebSocket URL Helper
const getWebSocketURL = (url: string) => {
  const protocol = url.startsWith('https') ? 'wss' : 'ws';
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `${protocol}://${cleanUrl}`;
};

// --- IMPROVED TOUR TOOLTIP COMPONENT ---
const TourTooltip = ({ text, onClose, align = 'center' }: { text: string, onClose: () => void, align?: 'center' | 'right' | 'left' }) => (
  <div className={`absolute z-[100] top-full mt-3 w-40 md:w-48 bg-blue-600 text-white text-xs p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 border border-blue-400/50
    ${align === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
    ${align === 'right' ? 'right-0' : ''}
    ${align === 'left' ? 'left-0' : ''}
  `}>
    <div className={`absolute -top-1.5 w-3 h-3 bg-blue-600 rotate-45 border-t border-l border-blue-400/50
        ${align === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
        ${align === 'right' ? 'right-3' : ''}
        ${align === 'left' ? 'left-3' : ''}
    `}></div>
    
    <div className="relative z-10 font-medium leading-relaxed text-center">
        {text}
    </div>
    <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="mt-2 text-[10px] uppercase font-bold bg-white/20 hover:bg-white/30 active:bg-white/40 w-full py-1.5 rounded transition-colors"
    >
        Got it
    </button>
  </div>
);

export default function InterviewPage() {
  const [step, setStep] = useState(1);
  const [jd, setJd] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // --- SERVER HEALTH STATE ---
  const [serverStatus, setServerStatus] = useState<'checking' | 'waking' | 'ready'>('checking');
  const [pingCount, setPingCount] = useState(0);

  // Settings
  const [selectedDuration, setSelectedDuration] = useState(15); 

  // Timers
  const [globalTime, setGlobalTime] = useState(0); 
  const [silenceTime, setSilenceTime] = useState(SILENCE_THRESHOLD);
  
  // State
  const [transcriptData, setTranscriptData] = useState<{sender:string, text:string}[]>([]);
  const [status, setStatus] = useState<'Idle' | 'Listening' | 'Speaking' | 'Processing' | 'Completed' | 'Feedback'>('Idle');
  const [feedback, setFeedback] = useState('');

  // --- TOUR STATE ---
  const [showTimeTour, setShowTimeTour] = useState(true); 
  const [showSilenceTour, setShowSilenceTour] = useState(false); 
  const [hasSeenSilenceTour, setHasSeenSilenceTour] = useState(false); 

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // LOGIC REFS
  const lastSpokenRef = useRef<number>(Date.now());
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const globalIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI Refs
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const liveTextEndRef = useRef<HTMLSpanElement | null>(null);
  const liveTextEndRefMobile = useRef<HTMLDivElement | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // --- 1. SERVER WAKE UP PROTOCOL ---
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); 

            const res = await fetch(`${BACKEND_URL}/`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (isMounted) {
                setServerStatus('ready');
            }
        } catch (e) {
            if (isMounted) {
                setServerStatus('waking');
                setPingCount(p => p + 1);
                setTimeout(checkServer, 3000);
            }
        }
    };
    checkServer();
    return () => { isMounted = false; };
  }, []);

  // --- 2. HEARTBEAT ---
  useEffect(() => {
    if (step === 2 && sessionId) {
        const heartbeatInterval = setInterval(async () => {
            try {
                await fetch(`${BACKEND_URL}/`);
            } catch (e) {
                console.warn("Heartbeat failed", e);
            }
        }, 90000); 
        return () => clearInterval(heartbeatInterval);
    }
  }, [step, sessionId]);

  // --- 2. TOUR LOGIC ---
  useEffect(() => {
    if (status === 'Listening' && !hasSeenSilenceTour && step === 2) {
        setShowSilenceTour(true);
        setHasSeenSilenceTour(true);
    }
  }, [status, hasSeenSilenceTour, step]);


  // --- 3. SCROLLING ---
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptData]);

  useEffect(() => {
    if (transcript.length > 0) {
        liveTextEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        liveTextEndRefMobile.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [transcript]);

  // --- 4. BATCH LISTENING LOGIC ---
  useEffect(() => {
    if (listening && transcript.length > 0) {
        lastSpokenRef.current = Date.now();
    }
  }, [transcript, listening]);

  useEffect(() => {
    if (status === 'Listening') {
        if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

        silenceIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const timeSinceLastWord = (now - lastSpokenRef.current) / 1000;
            const remaining = Math.max(0, SILENCE_THRESHOLD - Math.floor(timeSinceLastWord));
            
            setSilenceTime(remaining); 

            if (remaining === 0) {
                commitUserResponse(); 
            }
        }, 1000);
    } else {
        if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    }
    return () => {
        if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    };
  }, [status]);

  // --- REFACTORED COMMIT RESPONSE ---
  const commitUserResponse = () => {
    SpeechRecognition.stopListening();
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    setStatus('Processing');
  };

  useEffect(() => {
    if (status === 'Processing') {
        const finalText = transcript.trim();
        
        if (finalText.length > 0) {
            setTranscriptData(prev => [...prev, { sender: 'User', text: finalText }]);
            if (socketRef.current) {
                socketRef.current.send(JSON.stringify({ text: finalText, type: 'answer' }));
            }
        } else {
            // Check if this was a manual end or just silence
            // If the socket is open, we send the silence/timeout message
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                 setTranscriptData(prev => [...prev, { sender: 'System', text: 'No response detected...' }]);
                 socketRef.current.send(JSON.stringify({ text: '', type: 'silence_timeout' }));
            }
        }
        resetTranscript(); 
    }
  }, [status]); 

  // --- STEP 1: UPLOAD ---
  const handleStart = async () => {
    if (!browserSupportsSpeechRecognition) return alert("Please use Chrome/Edge.");
    if (!jd) return alert("Please enter a Job Description");
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('jd', jd);
      if (resumeFile) formData.append('resume', resumeFile);

      const res = await fetch(`${BACKEND_URL}/upload-context`, { method: 'POST', body: formData });
      
      if(!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setSessionId(data.session_id);
      
      setGlobalTime(selectedDuration * 60);
      setStep(2);
    } catch (err) {
      alert(`Connection Failed. Make sure backend is running.`);
    } finally {
      setIsUploading(false);
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

      const wsUrl = `${getWebSocketURL(BACKEND_URL)}/ws/interview/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      
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

  // --- UPDATED: HANDLE END INTERVIEW ---
  const handleEndInterview = () => {
      // 1. Stop Global Timer
      stopGlobalTimer();
      
      // 2. Stop Listening Engine
      SpeechRecognition.stopListening();
      
      // 3. IMMEDIATE FIX: Kill the silence interval logic so it doesn't count down
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
      
      // 4. Force state to Processing (visual) so UI doesn't look like it's listening
      setStatus('Processing');

      // 5. Send Signal
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
    setStatus('Listening');
    
    lastSpokenRef.current = Date.now();
    setSilenceTime(SILENCE_THRESHOLD); 
    
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const addTime = () => {
      lastSpokenRef.current += 10000;
      setSilenceTime(prev => prev + 10);
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
  if (!browserSupportsSpeechRecognition && step === 1) return <div className="p-10 text-white">Please use Google Chrome or Microsoft Edge.</div>;

  return (
    <div className="h-[100dvh] bg-gray-950 text-gray-100 font-sans flex flex-col overflow-hidden relative">
      
      {/* HEADER */}
      <div className="h-14 md:h-16 flex-none bg-gray-900 border-b border-gray-800 px-4 md:px-6 flex justify-between items-center shadow-lg z-50 relative">
         <div className="flex items-center gap-2">
            <Bot className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 truncate max-w-[150px] md:max-w-none">
                AI Recruiter Pro
            </h1>
         </div>
         {step === 2 && (
             <div className="flex items-center gap-2 md:gap-4 relative">
                 {status !== 'Feedback' && (
                    <button 
                        onClick={handleEndInterview}
                        className="flex items-center gap-1 md:gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors mr-2 md:mr-4"
                    >
                        <XCircle size={16} /> <span className="hidden md:inline">End</span>
                    </button>
                 )}

                 <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-gray-700">
                    <Clock size={16} className="text-blue-400 animate-pulse" />
                    <span className={`font-mono text-sm md:text-xl font-bold ${globalTime < 60 ? 'text-red-500' : 'text-white'}`}>
                        {formatTime(globalTime)}
                    </span>
                 </div>
                 
                 <div className="relative">
                    <button 
                        onClick={() => setGlobalTime(t => t + 120)}
                        className="flex items-center gap-1 text-[10px] md:text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-blue-800 transition-colors"
                    >
                        <Plus size={12}/> <span className="hidden md:inline">2m</span>
                    </button>
                    {showTimeTour && (
                        <TourTooltip 
                            text="Need more time? Click here to extend the interview." 
                            onClose={() => setShowTimeTour(false)}
                            align="right" 
                        />
                    )}
                 </div>
             </div>
         )}
         {step === 1 && (
             <div className="flex items-center gap-2 text-xs">
                 {serverStatus === 'ready' ? (
                     <span className="flex items-center gap-1 text-green-400"><Wifi size={14}/> <span className="hidden md:inline">Connected</span></span>
                 ) : (
                     <span className="flex items-center gap-1 text-amber-500 animate-pulse"><Loader2 size={14} className="animate-spin"/> Connecting...</span>
                 )}
             </div>
         )}
      </div>

      {/* ALERT: LESS THAN 1 MINUTE */}
      {step === 2 && globalTime <= 60 && globalTime > 0 && status !== 'Feedback' && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4">
             <div className="bg-orange-600/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-[0_0_20px_rgba(234,88,12,0.5)] flex items-center gap-3 border border-orange-400/50">
                <AlertTriangle size={18} className="animate-pulse text-orange-200" />
                <span className="text-xs md:text-sm font-bold">Less than 1m left!</span>
                <button 
                   onClick={() => setGlobalTime(t => t + 60)} 
                   className="bg-white text-orange-600 hover:bg-gray-100 px-3 py-1 rounded-full text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                >
                   <Plus size={12} /> 1 Min
                </button>
             </div>
         </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
      {step === 1 && (
        <div className="w-full max-w-xl mx-auto mt-2 md:mt-6 space-y-4 md:space-y-6 bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 overflow-y-auto">
           <div className="text-center mb-4 md:mb-6">
                <FileText size={40} className="mx-auto text-blue-500 mb-2 md:mb-4"/>
                <h2 className="text-xl md:text-2xl font-bold">Setup Interview</h2>
           </div>

           {serverStatus !== 'ready' && (
               <div className="bg-amber-900/20 border border-amber-800/50 p-3 md:p-4 rounded-xl flex flex-col gap-3 animate-pulse">
                   <div className="flex items-center gap-3 text-amber-300">
                       <Server className="animate-bounce shrink-0" size={24} />
                       <div>
                           <h3 className="font-bold text-sm">Waking up the AI... 😴</h3>
                           <p className="text-xs opacity-80">Takes ~40-50s (Free Tier)</p>
                       </div>
                   </div>
                   
                   <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-amber-500 h-full animate-progress-indeterminate"></div>
                   </div>

                   <div className="bg-gray-900/50 p-2 md:p-3 rounded-lg flex items-start gap-2 border border-amber-500/10">
                       <Coffee className="text-amber-400 shrink-0" size={16} />
                       <div className="text-xs text-gray-400 leading-tight">
                           <strong className="text-amber-200">Tip:</strong> We rely on free hosting. It will wake up soon! 🚀
                       </div>
                   </div>
               </div>
           )}
           
           <textarea 
              placeholder="Paste Job Description (JD)..." 
              className="w-full p-3 md:p-4 bg-gray-950 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-all text-sm md:text-base"
              rows={4}
              onChange={(e) => setJd(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer group h-24 md:h-32">
                    <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="text-gray-400 mb-2 group-hover:text-blue-400 transition-colors" size={24} />
                    <span className="text-gray-400 text-xs md:text-sm group-hover:text-white font-medium text-center px-2 truncate w-full">
                        {resumeFile ? resumeFile.name : "Upload Resume (PDF)"}
                    </span>
                </div>

                <div className="relative h-auto md:h-32">
                    <label className="block text-gray-400 text-xs uppercase font-bold mb-2 md:mb-2">Duration</label>
                    <select 
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full p-3 bg-gray-950 rounded-lg border border-gray-700 text-white focus:border-blue-500 text-sm md:text-base h-12 md:h-[calc(100%-2rem)]"
                    >
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={handleStart} 
                disabled={isUploading || serverStatus !== 'ready'}
                className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 text-sm md:text-base ${
                    serverStatus === 'ready' 
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-blue-500/25' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isUploading ? (
                  <><Loader2 className="animate-spin" /> Uploading...</>
              ) : serverStatus !== 'ready' ? (
                  <><Loader2 className="animate-spin" /> Waiting for Server...</>
              ) : (
                  <><Zap className="text-yellow-400" fill="currentColor"/> Start Interview</>
              )}
            </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 h-full min-h-0">
          
          {/* LEFT: AVATAR & CONTROLS */}
          <div className="flex-none lg:flex-1 h-[45%] lg:h-full bg-gray-900 rounded-2xl md:rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col">
            
            {status === 'Feedback' ? (
                <div className="flex flex-col h-full p-4 md:p-8">
                    <div className="flex justify-between items-center mb-4 flex-none">
                        <h2 className="text-xl md:text-3xl font-bold text-green-400">Feedback</h2>
                        <div className="flex gap-2">
                            <button onClick={downloadPDF} className="flex items-center gap-1 md:gap-2 bg-green-600 px-3 py-1.5 rounded-lg font-bold hover:bg-green-500 text-sm transition-colors">
                                <Download size={16}/> PDF
                            </button>
                            <button onClick={() => window.location.reload()} className="flex items-center gap-1 md:gap-2 bg-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-500 text-sm transition-colors">
                                <RefreshCcw size={16}/> New Interview
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-invert max-w-none text-gray-300 text-sm md:text-base whitespace-pre-wrap">
                        {feedback}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-between h-full p-4 md:p-8 relative">
                    {/* TOP STATUS BAR */}
                    <div className="h-12 flex justify-center items-center w-full flex-none z-20">
                        {status === 'Listening' && (
                            <div className="relative flex items-center gap-2 md:gap-3 bg-gray-800/80 px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-gray-700 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                                <span className="text-gray-400 text-xs md:text-sm font-bold uppercase hidden md:inline">Thinking</span>
                                
                                {/* COUNTDOWN */}
                                <div className={`font-mono text-xl md:text-2xl font-bold w-12 text-center ${silenceTime <= 3 ? 'text-red-500' : 'text-white'}`}>
                                    {silenceTime}s
                                </div>
                                
                                <div className="h-6 w-[1px] bg-gray-600 mx-1"></div>

                                {/* ADD TIME BUTTON */}
                                <div className="relative">
                                    <button onClick={addTime} className="hover:bg-gray-700 rounded-full text-blue-400 p-1.5 transition-colors"><Plus size={18}/></button>
                                    {showSilenceTour && (
                                        <TourTooltip 
                                            text="Need to think? Tap (+) to increase the timer." 
                                            onClose={() => setShowSilenceTour(false)}
                                            align="center" 
                                        />
                                    )}
                                </div>

                                {/* --- NEW FEATURE: DONE BUTTON --- */}
                                <button 
                                    onClick={commitUserResponse} 
                                    className="bg-green-600 hover:bg-green-500 text-white rounded-full p-1.5 ml-1 shadow-lg shadow-green-900/50 transition-all active:scale-95 flex items-center justify-center gap-1 px-3"
                                    title="Done Speaking"
                                >
                                    <Check size={16} strokeWidth={3} />
                                    <span className="text-xs font-bold uppercase hidden md:inline">Done</span>
                                </button>

                            </div>
                        )}
                    </div>

                    {/* --- DYNAMIC AVATAR CIRCLE --- */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 z-10">
                         <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center mb-4 md:mb-6 transition-all duration-700 relative flex-none 
                            ${status === 'Listening' ? 'bg-red-500/10 border-4 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 
                              status === 'Speaking' ? 'bg-blue-600/10 border-4 border-blue-500 scale-105 md:scale-110 shadow-[0_0_60px_rgba(37,99,235,0.4)]' : 
                              status === 'Processing' ? 'scale-110 shadow-[0_0_50px_rgba(168,85,247,0.4)] border-none' :
                              'bg-cyan-900/10 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-cyan-500/30 transition-shadow'
                            }`}>
                                {status === 'Processing' && (
                                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-blue-500 border-b-purple-500 border-l-blue-500 animate-spin opacity-80"></div>
                                )}
                                
                                {status === 'Speaking' && <Bot size={60} className="text-blue-400 animate-pulse md:w-20 md:h-20" />}
                                {status === 'Listening' && <User size={60} className="text-red-400 md:w-20 md:h-20" />}
                                {status === 'Processing' && (
                                    <BrainCircuit size={60} className="text-purple-400 animate-pulse md:w-20 md:h-20 z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                                )}
                                {status === 'Idle' && (
                                    <Sparkles size={60} className="text-cyan-400 animate-pulse duration-[3000ms] md:w-20 md:h-20 opacity-80" />
                                )}
                         </div>

                         <h2 className={`text-xl md:text-2xl font-bold flex-none transition-colors duration-500 
                            ${status === 'Processing' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse' : 
                              status === 'Idle' ? 'text-cyan-300' : 
                              'text-gray-200'
                            }`}>
                                {status === 'Processing' ? 'Analyzing Response...' : 
                                 status === 'Idle' ? 'AI Ready' : 
                                 status}
                         </h2>
                         
                         <div className="lg:hidden w-full text-center mt-2 h-14 overflow-y-auto">
                            {listening ? (
                                <>
                                  <span className="text-xs text-gray-400 italic">"{transcript}"</span>
                                  <div ref={liveTextEndRefMobile} className="h-1"></div>
                                </>
                            ) : (
                                <span className="text-gray-600 text-xs">...</span>
                            )}
                         </div>

                         <div className="hidden lg:block w-full mt-4 h-24 overflow-y-auto bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50 relative">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {listening ? (
                                    <>
                                      <span className="italic">"{transcript}"</span>
                                      <span ref={liveTextEndRef}></span>
                                    </>
                                ) : (
                                    <span className="text-gray-500 flex items-center justify-center gap-2 h-full">
                                        {status === 'Processing' ? <Loader2 className="animate-spin text-purple-500"/> : "..."}
                                    </span>
                                )}
                            </p>
                         </div>
                    </div>

                    {/* VISUALIZER */}
                    <div className="w-full flex items-center justify-center gap-1 h-6 md:h-8 flex-none mt-2 md:mt-4">
                         {status === 'Speaking' ? [1,2,3,4,5].map(i => (
                             <div key={i} className="w-1 md:w-1.5 bg-blue-500 rounded-full animate-bounce" style={{height: '20px', animationDelay: `${i*0.1}s`}}></div>
                         )) : (
                             <div className={`w-full h-[1px] ${status === 'Processing' ? 'bg-purple-500/50' : 'bg-gray-800'} relative overflow-hidden`}>
                                 {status === 'Processing' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent w-1/2 animate-[shimmer_1s_infinite]"></div>}
                             </div>
                         )}
                    </div>
                </div>
            )}
            <audio ref={audioRef} className="hidden" />
          </div>

          {/* RIGHT: TRANSCRIPT */}
          <div className="flex-1 lg:h-full bg-gray-900 rounded-2xl md:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col min-h-0">
             <div className="flex-none p-3 md:p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur z-10">
                 <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Transcript History</h3>
                 <span className="flex items-center gap-2 text-[10px] md:text-xs text-green-400"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
                {transcriptData.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'AI' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2`}>
                        {msg.sender === 'AI' && <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mr-2 flex-shrink-0"><Bot size={12} className="text-blue-400 md:w-4 md:h-4"/></div>}
                        
                        <div className={`px-3 py-2 md:px-4 md:py-3 max-w-[85%] rounded-2xl text-xs md:text-sm leading-relaxed ${
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