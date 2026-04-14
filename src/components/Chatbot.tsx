import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { AudioRecorder, AudioPlayer } from '../lib/audioUtils';
import { auth, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion, Timestamp, getDoc } from 'firebase/firestore';

// Initialize Gemini inside components to capture dynamic API keys
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an AI assistant answering on behalf of Ahmed Abdulrazek Abdelhakim, an MEP Director & Senior Project Management Professional (PMP).
Your primary directive is to answer questions SPECIFICALLY, CORRECTLY, and ON THE SPOT. 
Do not use filler words. Be direct, factual, and concise. Do not hallucinate information.
You can speak and understand both English and Egyptian Arabic. Respond in the language the user speaks to you. Maintain a serious, authoritative, and highly professional tone.

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

export default function Chatbot({ theme }: { theme: 'light' | 'dark' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSubmittedInfo, setHasSubmittedInfo] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '', phone: '' });
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: "Hello! Ask me any specific questions about Ahmed's experience, projects, or services." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopVoiceSession();
    }
  }, [isOpen]);

  useEffect(() => {
    const loadExistingSession = async () => {
      const savedSessionId = localStorage.getItem('chatSessionId');
      if (savedSessionId) {
        try {
          // Ensure anonymous auth is initialized before fetching
          await signInAnonymously(auth);
          const docRef = doc(db, 'chatSessions', savedSessionId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSessionId(savedSessionId);
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages);
            }
            if (data.visitorInfo) {
              setVisitorInfo(data.visitorInfo);
            }
            setHasSubmittedInfo(true);
            
            // Initialize the AI chat with the history
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            chatRef.current = ai.chats.create({
              model: 'gemini-3-flash-preview',
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }]
              }
            });
          } else {
            // Session was pruned or doesn't exist
            localStorage.removeItem('chatSessionId');
          }
        } catch (e: any) {
          if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
            // The user no longer has access to this session (e.g., anonymous auth was reset)
            // This is expected behavior, so we just clean up and don't log an error
            localStorage.removeItem('chatSessionId');
            setSessionId(null);
          } else {
            console.error("Error loading session:", e);
          }
        }
      }
    };
    
    loadExistingSession();
  }, []);

  const initChatSession = async () => {
    if (!chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }]
        }
      });
    }
    
    try {
      let uid = 'local-user';
      try {
        const userCredential = await signInAnonymously(auth);
        uid = userCredential.user.uid;
        setAuthError(null);
        console.log("Firebase Chat Connection: SUCCESSFUL");
      } catch (authErr: any) {
        console.warn("Firebase Auth failed, using local session mode:", authErr);
        if (authErr.code === 'auth/admin-restricted-operation') {
          setAuthError("Anonymous authentication is disabled in Firebase Console. Chats will not be saved to the database.");
        }
      }

      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
      
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(now.getDate() + 30); // Expire in 30 days

      // Only try to save to Firestore if we have a real UID (not 'local-user')
      if (uid !== 'local-user') {
        await setDoc(doc(db, 'chatSessions', newSessionId), {
          userId: uid,
          createdAt: Timestamp.fromDate(now),
          lastUpdatedAt: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiresAt),
          visitorInfo: visitorInfo,
          messages: [
            { role: 'model', text: "Hello! Ask me any specific questions about Ahmed's experience, projects, or services.", timestamp: now.toISOString() }
          ]
        });
      }
      
    } catch (error) {
      console.error("Error initializing chat session:", error);
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitorInfo.name.trim() && visitorInfo.phone.trim()) {
      setHasSubmittedInfo(true);
      initChatSession();
    }
  };

  useEffect(() => {
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }]
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
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    // Save user message to Firestore
    if (sessionId && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'chatSessions', sessionId), {
          lastUpdatedAt: Timestamp.now(),
          messages: arrayUnion({ role: 'user', text: userMsg, timestamp: new Date().toISOString() })
        });
      } catch (e) {
        console.error("Error saving message:", e);
      }
    }

    try {
      if (!chatRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }]
          }
        });
      }
      const response = await chatRef.current.sendMessage({ message: userMsg });
      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        
        // Save model message to Firestore
        if (sessionId && auth.currentUser) {
          try {
            await updateDoc(doc(db, 'chatSessions', sessionId), {
              lastUpdatedAt: Timestamp.now(),
              messages: arrayUnion({ role: 'model', text: response.text, timestamp: new Date().toISOString() })
            });
          } catch (e) {
            console.error("Error saving model message:", e);
          }
        }
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
            className={`fixed bottom-24 right-6 w-80 sm:w-96 border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col h-[500px] max-h-[80vh] transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm flex items-center justify-center bg-slate-200">
                  <img src="/Photo.jpg" alt="Ahmed" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Ahmed</h3>
                  <p className="text-xs text-emerald-500">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleVoiceMode} 
                  className={`p-2 rounded-full transition-colors ${isVoiceMode ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                  title={isVoiceMode ? "Switch to Text" : "Switch to Voice"}
                >
                  {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className={`transition-colors p-2 ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {!hasSubmittedInfo ? (
              <div className={`flex-1 flex flex-col p-6 overflow-y-auto transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="mb-6 text-center">
                  <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Welcome!</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Please provide your details to start the chat.</p>
                </div>
                <form onSubmit={handleInfoSubmit} className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Name *</label>
                    <input 
                      type="text" 
                      required
                      value={visitorInfo.name}
                      onChange={e => setVisitorInfo({...visitorInfo, name: e.target.value})}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Phone *</label>
                    <input 
                      type="tel" 
                      required
                      value={visitorInfo.phone}
                      onChange={e => setVisitorInfo({...visitorInfo, phone: e.target.value})}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      placeholder="Your Phone Number"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Email (Optional)</label>
                    <input 
                      type="email" 
                      value={visitorInfo.email}
                      onChange={e => setVisitorInfo({...visitorInfo, email: e.target.value})}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      placeholder="Your Email"
                    />
                  </div>
                  <div className="mt-auto pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                    >
                      Start Chat
                    </button>
                  </div>
                </form>
              </div>
            ) : isVoiceMode ? (
              <div className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                <motion.div 
                  animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isListening ? 'bg-blue-600/20 text-blue-500' : theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}
                >
                  <Mic className="w-10 h-10" />
                </motion.div>
                <h3 className={`text-xl font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Voice Assistant</h3>
                <p className={`text-center text-sm transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isListening ? "Listening... Speak in English or Egyptian Arabic." : "Connecting to voice server..."}
                </p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                  {authError && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-xs text-center mb-4">
                      {authError}
                    </div>
                  )}
                  {voiceError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                      {voiceError}
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm transition-colors ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-md' : theme === 'dark' ? 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                        {msg.role === 'model' ? (
                          <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
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
                      <div className={`p-3 rounded-2xl rounded-bl-none border transition-colors ${theme === 'dark' ? 'bg-slate-800 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className={`p-4 border-t transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about Ahmed's experience..."
                      className={`w-full border rounded-full pl-4 pr-12 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'}`}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-sm"
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

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className={`pointer-events-auto text-sm font-medium px-4 py-2 rounded-2xl shadow-2xl border flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Ask me anything!
          </motion.div>
        )}
        <div className="relative pointer-events-auto">
          {!isOpen && (
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30 duration-1000"></div>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={!isOpen ? { y: [0, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-16 h-16 bg-gradient-to-tr from-blue-700 to-blue-500 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center z-50 p-0.5"
          >
            {isOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/50 relative bg-slate-200">
                <img src="/Photo.jpg" alt="Ahmed" className="w-full h-full object-cover" />
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}
