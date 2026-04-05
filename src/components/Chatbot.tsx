import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { AudioRecorder, AudioPlayer } from '../lib/audioUtils';

// Initialize Gemini inside components to capture dynamic API keys
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an AI assistant answering on behalf of Ahmed Abdelrazek Abdelhakim, an MEP Director & Senior Project Management Professional (PMP).
Your primary directive is to answer questions SPECIFICALLY, CORRECTLY, and ON THE SPOT. 
Do not use filler words. Be direct, factual, and concise. Do not hallucinate information.
You can speak and understand both English and Egyptian Arabic. Respond in the language the user speaks to you. Maintain a highly professional and intuitive tone.

FACTS ABOUT AHMED:
- Experience: 20+ years in large-scale MEP, infrastructure, and building projects across Saudi Arabia.
- Education: Bachelor of Mechanical Engineering (Power & Energy), Egypt (1998).
- Certifications: PMP, IAM Diploma "Asset management", CMRP, CAMA, LEED Green Associate, Six Sigma Certified, SCRUM Fundamentals.
- Core Expertise: Full project lifecycle management, MEP Design Management, Value Engineering, Testing/Commissioning/Handover, Facility & Asset Management.
- Technical Skills: HVAC, Firefighting, Plumbing & Electrical Systems. MS Project, Primavera P6, Power BI, CAFM / Infor EAM.
- Competitive Advantage: Integrates "Design for Operation" and "Build for Value". Deep knowledge of ARAMCO & international codes/standards. Ensures seamless transition from construction to Operations & Maintenance (O&M).

LOGISTICS & AVAILABILITY (For Recruiters/New Opportunities):
- Current Location: Jeddah, Saudi Arabia.
- Work Authorization: Holds a valid, Transferable Iqama (ready for local transfer in KSA).
- Contact: Phone (+966 567297258), Email (ahmed_abd_alrazek@yahoo.com).
- Status: Open to new executive/director level opportunities in MEP and Project Management.

WORK HISTORY:
1. MAC-EST (Aug 2022 - Present): MEP Lead & Senior Projects Manager - Projects Delivery. 
   - Projects: Team-lab project (Design & build), Saudi Cargo facilities, 'Oreka' entertainment project, Red Sea Film Foundation (PMC services), Jeddah Islamic Biennale (PMO service).
2. AlFadhili Field Housing Project / MASIC & ARAMCO JV (Jul 2019 - Jun 2022): MEP Manager - Project Delivery. 
   - Managed full MEP lifecycle for ARAMCO. Led commissioning/handover to O&M. Monitored FM performance using CAFM & Power BI.
3. SBCM - EMAAR Projects, KAEC (May 2015 - Jul 2019): MEP Manager / Consultant - Project delivery. 
   - Provided PMC services, design review, and led value engineering initiatives.
4. Alandalus Property Company (May 2013 - Jul 2015): Senior Mechanical Engineer / MEP Coordinator. 
   - Managed contractor design coordination in line with IHG operational standards.
5. Sharqawi Co. (May 2009 - Sep 2011): Senior Mechanical Engineer / Mechanical Lead. 
   - Led site mechanical teams and coordinated engineering-construction interface.

If asked a question, provide the exact answer immediately without conversational fluff.`;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: "Hello! Ask me any specific questions about Ahmed's experience, projects, or services." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (!chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });
    }
    
    return () => {
      stopVoiceSession();
    };
  }, []);

  const startVoiceSession = async () => {
    setIsListening(true);
    setVoiceError(null);
    try {
      if (!playerRef.current) playerRef.current = new AudioPlayer();
      playerRef.current.init();

      if (!recorderRef.current) recorderRef.current = new AudioRecorder();

      // Request microphone access and start recording FIRST to catch permission errors
      await recorderRef.current.start((base64) => {
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playerRef.current?.playBase64(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              playerRef.current?.stop();
              playerRef.current?.init();
            }
          },
          onclose: () => {
            stopVoiceSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopVoiceSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Fenrir" } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start voice session:", err);
      setVoiceError("Microphone access denied. Please allow permissions in your browser.");
      stopVoiceSession();
      setIsVoiceMode(false);
    }
  };

  const stopVoiceSession = () => {
    setIsListening(false);
    recorderRef.current?.stop();
    playerRef.current?.stop();
    sessionRef.current = null;
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      stopVoiceSession();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      startVoiceSession();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          }
        });
      }
      const response = await chatRef.current.sendMessage({ message: userMsg });
      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      } else {
        throw new Error("No text in response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error connecting to my knowledge base. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col h-[500px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-slate-800 p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Ahmed</h3>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleVoiceMode} 
                  className={`p-2 rounded-full transition-colors ${isVoiceMode ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                  title={isVoiceMode ? "Switch to Text" : "Switch to Voice"}
                >
                  {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {isVoiceMode ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900">
                <motion.div 
                  animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isListening ? 'bg-blue-600/20 text-blue-500' : 'bg-slate-800 text-slate-500'}`}
                >
                  <Mic className="w-10 h-10" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">Voice Assistant</h3>
                <p className="text-slate-400 text-center text-sm">
                  {isListening ? "Listening... Speak in English or Egyptian Arabic." : "Connecting to voice server..."}
                </p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {voiceError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                      {voiceError}
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none'}`}>
                        {msg.role === 'model' ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 border border-white/5 p-3 rounded-2xl rounded-bl-none">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-white/10">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about Ahmed's experience..."
                      className="w-full bg-slate-800 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:bg-blue-500 transition-colors"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
