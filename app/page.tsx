"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  Video, 
  ScanFace, 
  LineChart,
  Globe2,
  Trophy,
  Flame,
  Target,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Shuffle,
  Cpu,
  FileText,
  Layers,
  BookOpen,
  RefreshCw,
  Quote
} from "lucide-react";

// --- DATA: WORD OF THE DAY (20 WORDS) ---
const VOCAB_LIST = [
    { word: "Perspicacious", type: "adj.", meaning: "Having a ready insight into and understanding of things.", example: "Her perspicacious analysis of the market trends impressed the CEO." },
    { word: "Ephemeral", type: "adj.", meaning: "Lasting for a very short time.", example: "Fashion trends are often ephemeral, changing with every season." },
    { word: "Obfuscate", type: "verb", meaning: "Render obscure, unclear, or unintelligible.", example: "The politician used jargon to obfuscate the truth about the budget cuts." },
    { word: "Eloquent", type: "adj.", meaning: "Fluent or persuasive in speaking or writing.", example: "His eloquent speech moved the audience to tears." },
    { word: "Ubiquitous", type: "adj.", meaning: "Present, appearing, or found everywhere.", example: "Smartphones have become ubiquitous in modern society." },
    { word: "Pragmatic", type: "adj.", meaning: "Dealing with things sensibly and realistically.", example: "We need a pragmatic solution to this logistical problem." },
    { word: "Cacophony", type: "noun", meaning: "A harsh, discordant mixture of sounds.", example: "The cacophony of the construction site made it hard to concentrate." },
    { word: "Enigmatic", type: "adj.", meaning: "Difficult to interpret or understand; mysterious.", example: "The Mona Lisa's smile is famously enigmatic." },
    { word: "Fastidious", type: "adj.", meaning: "Very attentive to and concerned about accuracy and detail.", example: "He was fastidious about his appearance, always wearing a pressed suit." },
    { word: "Gregarious", type: "adj.", meaning: "Fond of company; sociable.", example: "She is a gregarious person who loves hosting dinner parties." },
    { word: "Iconoclast", type: "noun", meaning: "A person who attacks cherished beliefs or institutions.", example: "Steve Jobs was an iconoclast who revolutionized the tech industry." },
    { word: "Languid", type: "adj.", meaning: "Displaying or having a disinclination for physical exertion or effort.", example: "They spent a languid afternoon by the pool." },
    { word: "Mellifluous", type: "adj.", meaning: "(of a voice or words) sweet or musical; pleasant to hear.", example: "She had a rich, mellifluous voice that captivated the audience." },
    { word: "Nefarious", type: "adj.", meaning: "(typically of an action or activity) wicked or criminal.", example: "The hackers had nefarious intent to steal user data." },
    { word: "Ostentatious", type: "adj.", meaning: "Characterized by vulgar or pretentious display; designed to impress.", example: "The billionaire's ostentatious lifestyle attracted much criticism." },
    { word: "Panacea", type: "noun", meaning: "A solution or remedy for all difficulties or diseases.", example: "Technology is not a panacea for all educational problems." },
    { word: "Quixotic", type: "adj.", meaning: "Exceedingly idealistic; unrealistic and impractical.", example: "His plan to save the world single-handedly was noble but quixotic." },
    { word: "Reticent", type: "adj.", meaning: "Not revealing one's thoughts or feelings readily.", example: "She was reticent about her personal life during the interview." },
    { word: "Syophant", type: "noun", meaning: "A person who acts obsequiously toward someone important in order to gain advantage.", example: "The manager was surrounded by sycophants agreeing with his every word." },
    { word: "Trepidation", type: "noun", meaning: "A feeling of fear or agitation about something that may happen.", example: "He opened the letter with some trepidation." }
];

export default function VocaLandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // --- WORD OF DAY STATE ---
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimatingWord, setIsAnimatingWord] = useState(false);

  // --- NAVIGATION ---
  const navigateToCommSkills = () => router.push("/topics-page");
  const navigateToInterview = () => router.push("/interview-page");

  // --- SCROLL EFFECT ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- INITIAL RANDOM WORD ---
  useEffect(() => {
      setCurrentWordIndex(Math.floor(Math.random() * VOCAB_LIST.length));
  }, []);

  const shuffleWord = () => {
      setIsAnimatingWord(true);
      setTimeout(() => {
          let newIndex;
          do {
              newIndex = Math.floor(Math.random() * VOCAB_LIST.length);
          } while (newIndex === currentWordIndex);
          setCurrentWordIndex(newIndex);
          setIsAnimatingWord(false);
      }, 300);
  };

  const currentWord = VOCAB_LIST[currentWordIndex];

  return (
    <div className="min-h-screen bg-[#030304] text-gray-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#030304]/80 backdrop-blur-lg border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
            {/* LOGO */}
            <div className="flex items-center gap-2">
                <BrainCircuit className="text-purple-500 w-8 h-8" />
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                    VOCA
                </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                <button onClick={() => document.getElementById('workflow')?.scrollIntoView({behavior:'smooth'})} className="hover:text-purple-400 transition-colors">How it Works</button>
                <button onClick={() => document.getElementById('lexicon')?.scrollIntoView({behavior:'smooth'})} className="hover:text-purple-400 transition-colors">Word of Day</button>
                <button onClick={navigateToInterview} className="hover:text-purple-400 transition-colors">Interview Prep</button>
                <Button onClick={navigateToInterview} className="bg-white text-black hover:bg-gray-200 font-bold rounded-full px-6 transition-transform hover:scale-105">
                    Start Free
                </Button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12">
        
        {/* Cinematic Backdrop - IMPROVED VISIBILITY (Opactity 70%) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Reduced opacity of overlay to 70% to make girl more visible */}
            <div className="absolute inset-0 bg-[#030304]/70 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-[#030304]/40 to-transparent z-10"></div>
            
            {/* The Girl Image */}
            <img 
                src="/girl.png" 
                alt="Confident Speaker" 
                className="w-full h-full object-cover object-center scale-105 opacity-80 mix-blend-overlay animate-slow-pan"
            />
        </div>

        <div className="relative z-20 container mx-auto px-4 md:px-6 flex flex-col items-center">
            
            {/* Hero Text */}
            <div className="text-center max-w-4xl mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 animate-fade-in-up backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-purple-200 tracking-wider uppercase">AI Live Analysis</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-none text-white drop-shadow-2xl">
                    Speak Like <br className="md:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">A Leader.</span>
                </h1>
                
                <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
                    The world's most advanced AI communication coach. Master your interviews, analyze your body language, and articulate with confidence.
                </p>
            </div>

            {/* --- IMPROVED HERO CARDS (ALIGNED BUTTONS) --- */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
    
    {/* 1. INTERVIEW CARD */}
    <div 
        onClick={navigateToInterview}
        className="group relative cursor-pointer flex flex-col h-full"
    >
        {/* Glowing Border Gradient */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-3xl opacity-70 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all duration-500"></div>
        
        <div className="relative h-full bg-[#0a0a0e] rounded-[23px] overflow-hidden flex flex-col flex-1">
            {/* Internal Grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="p-8 relative z-10 flex flex-col flex-1 items-center text-center">
                
                {/* LIVE AVATAR ANIMATION */}
                <div className="relative w-24 h-24 mb-6 mt-2 flex-none">
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-blue-500 border-b-purple-500 border-l-blue-500 animate-spin opacity-80 shadow-[0_0_30px_rgba(168,85,247,0.4)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit size={40} className="text-blue-400 animate-pulse drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 border border-blue-500/50 text-[10px] text-blue-300 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        AI LISTENING
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">Interview Prep</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-sm flex-1">
                    Face our AI Recruiter in a realistic simulation. Get grilled on your resume, receive instant feedback, and get hired.
                </p>

                {/* PUSH BUTTON TO BOTTOM */}
                <div className="w-full mt-auto">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-900/20 group-hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2">
                        Enter Simulation <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </div>
    </div>

    {/* 2. SPEECH & VIDEO CARD 
    <div 
        onClick={navigateToCommSkills}
        className="group relative cursor-pointer flex flex-col h-full"
    >
        // Stronger Border Gradient
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl opacity-60 group-hover:opacity-100 blur-sm transition-all duration-500"></div>
        
        // Brighter Background & Shadow
        <div className="relative h-full bg-[#0e0e12] rounded-[23px] overflow-hidden flex flex-col flex-1 hover:bg-[#121218] transition-colors shadow-[0_0_40px_rgba(168,85,247,0.1)]">
            <div className="p-8 relative z-10 flex flex-col flex-1">
                
                <div className="flex justify-between items-start mb-6 flex-none">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/40 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <Video className="text-purple-400 w-6 h-6" />
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-[10px] font-bold text-purple-200 uppercase tracking-wider shadow-sm">
                        AI Vision V2
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-white mb-2">Speech & Video</h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed flex-1">
                    Record yourself on any topic. Our vision engine tracks your eye contact, gestures, and fillers to build your confidence.
                </p>

                // Visualizer Animation
                <div className="mt-auto h-12 flex items-center justify-center gap-1 mb-6 opacity-80 group-hover:opacity-100 transition-opacity flex-none">
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <div key={i} className="w-1.5 bg-gradient-to-t from-purple-600 via-pink-500 to-purple-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{height: `${Math.random() * 25 + 10}px`, animationDelay: `${i * 0.1}s`}}></div>
                    ))}
                </div>

                // PUSH BUTTON TO BOTTOM - ALIGNED WITH CARD 1
                <div className="w-full mt-auto">
                    <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2">
                        Activate Vision Engine <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </div>
    </div>
    */}

    </div>
  </div>
</div>
      {/* --- SECTION: HOW VOCA WORKS (WORKFLOW) --- */}
      <section id="workflow" className="py-24 bg-[#050507] relative overflow-hidden">
        {/* Connection Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -translate-y-1/2 hidden md:block"></div>
        
        <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">The <span className="text-purple-500">VOCA</span> Workflow</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">From impromptu topic to detailed report in four simple steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Step 1: Topic */}
                <div className="relative group">
                    <div className="bg-[#0e0e12] border border-white/10 p-6 rounded-2xl relative z-10 hover:border-purple-500/50 transition-all hover:-translate-y-2 shadow-lg h-full">
                        <div className="w-14 h-14 bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                            <Shuffle size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">1. Impromptu Topic</h3>
                        <p className="text-gray-400 text-sm">Our system generates a random topic or scenario to test your on-the-spot thinking.</p>
                    </div>
                </div>

                {/* Step 2: Recording */}
                <div className="relative group">
                    <div className="bg-[#0e0e12] border border-white/10 p-6 rounded-2xl relative z-10 hover:border-purple-500/50 transition-all hover:-translate-y-2 shadow-lg h-full">
                         <div className="w-14 h-14 bg-red-900/20 rounded-xl flex items-center justify-center text-red-400 mb-4 border border-red-500/20">
                            <Layers size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">2. Multi-Modal Rec</h3>
                        <p className="text-gray-400 text-sm">We record your video (gestures), audio (tone), and content (grammar) simultaneously.</p>
                    </div>
                </div>

                {/* Step 3: Analysis */}
                <div className="relative group">
                    <div className="bg-[#0e0e12] border border-white/10 p-6 rounded-2xl relative z-10 hover:border-purple-500/50 transition-all hover:-translate-y-2 shadow-lg h-full">
                        {/* Pulse Effect */}
                        <div className="absolute -inset-1 bg-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20 bg-[#0e0e12] relative z-10">
                            <Cpu size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 relative z-10">3. AI Analysis</h3>
                        <p className="text-gray-400 text-sm relative z-10">Deep learning models analyze 50+ data points including eye contact, WPM, and fillers.</p>
                    </div>
                </div>

                {/* Step 4: Feedback */}
                <div className="relative group">
                    <div className="bg-[#0e0e12] border border-white/10 p-6 rounded-2xl relative z-10 hover:border-purple-500/50 transition-all hover:-translate-y-2 shadow-lg h-full">
                        <div className="w-14 h-14 bg-green-900/20 rounded-xl flex items-center justify-center text-green-400 mb-4 border border-green-500/20">
                            <FileText size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">4. Growth Report</h3>
                        <p className="text-gray-400 text-sm">Receive a comprehensive report card with actionable tips to improve instantly.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- BEFORE VS AFTER SECTION --- */}
      <section className="py-24 bg-[#0a0a0e] border-y border-white/5">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Don't just speak. <span className="text-blue-500">Improve.</span></h2>
                <p className="text-gray-400">See how VOCA transforms your raw speech into professional articulation.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
                {/* BEFORE CARD */}
                <div className="relative">
                     <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-8 relative overflow-hidden backdrop-blur-sm h-full">
                        <div className="absolute top-4 right-4 text-red-500 opacity-50"><XCircle size={24}/></div>
                        <h3 className="text-red-400 font-bold mb-4 uppercase text-xs tracking-widest">Raw Input</h3>
                        <p className="text-lg text-gray-300 leading-relaxed font-mono text-sm md:text-base">
                            "So, uh, basically, I think I'm <span className="text-red-400 line-through decoration-red-500">gonna be</span> good for this role cause like, I did some stuff in Java before."
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded">Filler Words Detected</span>
                            <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded">Low Confidence</span>
                        </div>
                     </div>
                     {/* Arrow for Mobile/Desktop */}
                     <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 md:hidden text-gray-500"><ArrowRight className="rotate-90"/></div>
                     <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block text-gray-500"><ArrowRight /></div>
                </div>

                {/* AFTER CARD */}
                <div className="bg-green-950/10 border border-green-500/20 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)] backdrop-blur-sm h-full">
                    <div className="absolute top-4 right-4 text-green-500"><CheckCircle2 size={24}/></div>
                    <h3 className="text-green-400 font-bold mb-4 uppercase text-xs tracking-widest">VOCA Refined</h3>
                    <p className="text-lg text-white leading-relaxed font-medium">
                        "I believe I am <span className="text-green-400 underline decoration-wavy">an excellent candidate</span> for this role because I have <span className="text-green-400">extensive experience</span> developing scalable applications in Java."
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded">Professional Tone</span>
                        <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded">Impactful Vocabulary</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- NEW SECTION: WORD OF THE DAY (LEXICON) --- */}
      <section id="lexicon" className="py-24 bg-gradient-to-b from-[#030304] to-[#0a0a0e] border-t border-white/5">
         <div className="container mx-auto px-6 max-w-4xl">
             <div className="text-center mb-12">
                 <div className="flex items-center justify-center gap-2 mb-4 text-purple-400">
                     <BookOpen size={24} />
                     <span className="font-bold uppercase tracking-widest text-xs">Voca Lexicon</span>
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold mb-4">Word of the <span className="text-purple-500">Day</span></h2>
                 <p className="text-gray-400">Expand your sophisticated vocabulary one word at a time.</p>
             </div>

             <div className="relative">
                 {/* Decorative Glow */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/10 blur-[100px] rounded-full"></div>
                 
                 <div className={`bg-[#0e0e12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center relative z-10 transition-all duration-300 ${isAnimatingWord ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                     
                     <div className="flex justify-between items-start mb-8">
                         <Quote className="text-purple-500 opacity-50 rotate-180" size={32} />
                         <Button 
                            onClick={shuffleWord}
                            variant="ghost" 
                            className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full p-2"
                            title="New Word"
                         >
                             <RefreshCw size={20} className={isAnimatingWord ? "animate-spin" : ""} />
                         </Button>
                     </div>

                     <h3 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-2">
                         {currentWord?.word || "Loading..."}
                     </h3>
                     <p className="text-xl text-purple-400 italic font-serif mb-8">{currentWord?.type}</p>
                     
                     <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mb-8"></div>

                     <p className="text-2xl text-gray-200 font-medium mb-6 leading-relaxed">
                         "{currentWord?.meaning}"
                     </p>

                     <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-left inline-block max-w-2xl mx-auto">
                         <span className="text-gray-500 text-xs font-bold uppercase block mb-2">Sample Usage</span>
                         <p className="text-gray-300 italic">
                             "{currentWord?.example}"
                         </p>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* --- NEW SECTION: GAMIFICATION --- */}
      <section className="py-24 bg-[#0a0a0e] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-blue-900/5 blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-purple-900/5 blur-[120px]"></div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-16">
                
                {/* Text Content */}
                <div className="md:w-1/2">
                    <div className="flex items-center gap-2 text-yellow-400 font-bold mb-4 uppercase tracking-widest text-xs">
                        <Trophy size={16} /> Gamified Learning
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Make improvement <br/> <span className="text-white">Addictive.</span></h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Building soft skills shouldn't be boring. Earn XP for every interview, keep your streak alive, and climb the global leaderboards.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="bg-orange-500/20 p-3 rounded-lg text-orange-400"><Flame size={24} /></div>
                            <div>
                                <div className="font-bold text-white text-lg">Daily Streak</div>
                                <div className="text-xs text-gray-500">Commit to 15m/day</div>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400"><Target size={24} /></div>
                            <div>
                                <div className="font-bold text-white text-lg">Leagues</div>
                                <div className="text-xs text-gray-500">Compete with peers</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Cards Mockup */}
                <div className="md:w-1/2 grid gap-6">
                    {/* Streak Card */}
                    <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 p-6 rounded-2xl flex items-center justify-between transform rotate-2 hover:rotate-0 transition-transform">
                        <div>
                            <div className="text-orange-400 font-bold uppercase text-xs mb-1">Current Streak</div>
                            <div className="text-4xl font-bold text-white">12 Days</div>
                        </div>
                        <Flame size={48} className="text-orange-500 animate-pulse" />
                    </div>

                    {/* Badge Card */}
                    <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl transform -rotate-2 hover:rotate-0 transition-transform hover:border-blue-500/50">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-300">Recent Achievements</h4>
                            <span className="text-xs text-blue-400 cursor-pointer">View All</span>
                        </div>
                        <div className="flex gap-4">
                            {['SpeakUp', 'Orator', 'Guru'].map((badge, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${i===0 ? 'from-blue-500 to-cyan-500' : i===1 ? 'from-purple-500 to-pink-500' : 'from-yellow-500 to-orange-500'}`}>
                                        <Trophy size={20} className="text-white" />
                                    </div>
                                    <span className="text-[10px] text-gray-400">{badge}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black py-12 border-t border-white/10">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <BrainCircuit size={24} className="text-purple-500" /> 
                <span className="font-bold text-lg text-white">VOCA</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500 font-medium">
                <a href="#" className="hover:text-purple-400 transition-colors">Technology</a>
                <a href="#" className="hover:text-purple-400 transition-colors">Pricing</a>
                <a href="#" className="hover:text-purple-400 transition-colors">Community</a>
            </div>
            <div className="text-gray-600 text-sm">
                &copy; 2026 VOCA
            </div>
          </div>
      </footer>
    </div>
  );
}
