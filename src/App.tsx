import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
import ReactMarkdown from 'react-markdown';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
import { 
  Briefcase, 
  LineChart, 
  Mail, 
  ChevronRight,
  Linkedin,
  Phone,
  MapPin,
  Award,
  Building,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Wrench,
  Users,
  Download,
  Youtube,
  FileText,
  MonitorPlay,
  ExternalLink,
  X,
  Music,
  VolumeX,
  ChevronLeft,
  Maximize2,
  Eye,
  Newspaper,
  Clock,
  Sun,
  Moon,
  Leaf
} from 'lucide-react';
import Chatbot from './components/Chatbot';
import AdminDashboard from './components/AdminDashboard';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, orderBy, onSnapshot, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

type Theme = 'light' | 'dark';

const GalleryImage = ({ src, alt, index, onClick }: { src: string, alt: string, index: number, onClick: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500"
      onClick={onClick}
    >
      {/* Sophisticated Skeleton Loader */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-800/80 overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          
          {/* Placeholder Icon */}
          <div className="w-16 h-16 mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          {/* Loading Text */}
          <div className="h-3 w-24 bg-slate-700/50 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/2 bg-blue-500/50 rounded-full animate-shimmer"></div>
          </div>
        </div>
      )}
      
      <img 
        ref={imgRef}
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-125 ${isLoaded ? 'opacity-90 group-hover:opacity-100' : 'opacity-0'}`}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format&fit=crop&blur=100`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-20">
        <motion.div 
          whileHover={{ scale: 1.2, rotate: 90 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <Maximize2 className="w-10 h-10 text-white drop-shadow-lg" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (currentHash === '#admin') {
    return <AdminDashboard theme={theme} toggleTheme={toggleTheme} />;
  }

  return <MainApp theme={theme} toggleTheme={toggleTheme} />;
}

function MainApp({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  useEffect(() => {
    // Fetch News Feed
    const qNews = query(collection(db, 'news_feed'), orderBy('createdAt', 'desc'));
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNewsItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeNews();
  }, []);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const visitorRef = doc(db, 'analytics', 'visitors');
        const docSnap = await getDoc(visitorRef);
        
        if (!docSnap.exists()) {
          await setDoc(visitorRef, { count: 1 });
          setVisitorCount(1);
        } else {
          // Only increment if not already counted in this session
          if (!sessionStorage.getItem('hasVisited')) {
            await updateDoc(visitorRef, { count: increment(1) });
            sessionStorage.setItem('hasVisited', 'true');
            setVisitorCount(docSnap.data().count + 1);
          } else {
            setVisitorCount(docSnap.data().count);
          }
        }
      } catch (error) {
        console.error("Error tracking visitor:", error);
      }
    };

    trackVisitor();
  }, []);

  const services = [
    {
      icon: <Briefcase className="w-6 h-6 text-blue-400" />,
      title: "Project Management",
      description: "Full lifecycle management, budgeting, cost control, and Primavera P6 scheduling."
    },
    {
      icon: <Wrench className="w-6 h-6 text-amber-400" />,
      title: "MEP Engineering",
      description: "Design Management, HVAC, firefighting, plumbing, electrical systems, and value engineering."
    },
    {
      icon: <Building className="w-6 h-6 text-green-400" />,
      title: "Asset Management",
      description: "Certified assessment, CAFM/Infor EAM integration, and transition to O&M."
    },
    {
      icon: <LineChart className="w-6 h-6 text-orange-400" />,
      title: "Risk & Strategy",
      description: "Risk mitigation, cash flow management, and Power BI data analytics."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      title: "Quality & Compliance",
      description: "ARAMCO standards, HSE, life safety, and regulatory compliance."
    },
    {
      icon: <Users className="w-6 h-6 text-amber-400" />,
      title: "Team Leadership",
      description: "Agile, SCRUM, Lean Six Sigma principles, and multidisciplinary team mentoring."
    },
    {
      icon: <Leaf className="w-6 h-6 text-emerald-400" />,
      title: "Sustainability",
      description: "LEED Green Associate certified. Implementing energy-efficient solutions, green building standards, and sustainable MEP practices."
    }
  ];

  const projects = [
    {
      name: "Team-lab Project",
      role: "MEP Lead & Senior Projects Manager",
      duties: [
        "Lead end-to-end project management for high-profile cultural and digital art projects.",
        "Managed Design and build project scope."
      ]
    },
    {
      name: "Saudi Cargo Facilities",
      role: "MEP Project Manager",
      duties: [
        "Managed MEP scope, coordination, and delivery.",
        "Developed and controlled project schedules, budgets, and risk registers.",
        "Coordinated with architects, consultants, and international stakeholders."
      ]
    },
    {
      name: "Oreka Entertainment & Attraction",
      role: "MEP Project Manager",
      duties: [
        "Led MEP project management and execution.",
        "Ensured seamless integration with architectural and AVL systems.",
        "Managed procurement strategies, contracts, variations, and claims."
      ]
    },
    {
      name: "Red Sea Film Foundation",
      role: "PMC Services Lead",
      duties: [
        "Provided Project Management Consultancy (PMC) services.",
        "Oversaw consultants and contractors.",
        "Ensured strict compliance with project objectives and timelines."
      ]
    },
    {
      name: "Jeddah Islamic Biennale",
      role: "PMO Service",
      duties: [
        "Provided PMO services for the project.",
        "Ensured on-time project delivery through proactive risk and change management."
      ]
    },
    {
      name: "AlFadhili Field Housing (ARAMCO JV)",
      role: "MEP Manager",
      duties: [
        "Managed full MEP project lifecycle for large-scale residential and infrastructure facilities.",
        "Ensured compliance with ARAMCO standards, QA/QC, and HSE.",
        "Led commissioning, testing, handover, and transition to O&M phase."
      ]
    },
    {
      name: "EMAAR Projects, KAEC",
      role: "MEP Manager / Consultant",
      duties: [
        "Provided project management and supervision consultancy.",
        "Led value engineering initiatives to optimize cost without compromising quality.",
        "Coordinated with authorities to ensure life safety and regulatory compliance."
      ]
    },
    {
      name: "Alandalus Property Developments",
      role: "MEP Coordinator",
      duties: [
        "Managed contractor design coordination in line with IHG operational standards.",
        "Prepared RFPs, technical evaluations, and procurement recommendations.",
        "Controlled cost, schedule, and quality throughout execution stages."
      ]
    }
  ];

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const galleryPhotos = [
    "/WhatsApp Image 2026-04-05 at 8.17.35 PM.jpeg",
    "/WhatsApp Image 2026-04-05 at 8.06.17 PM.jpeg",
    "/WhatsApp Image 2026-04-05 at 8.04.31 PM.jpeg",
    "/WhatsApp Image 2026-04-05 at 6.08.21 PM.jpeg",
    "/WhatsApp Image 2026-04-05 at 6.09.06 PM.jpeg",
    "/WhatsApp Image 2026-04-05 at 6.09.08 PM.jpeg",
    "/WhatsApp Image 2026-04-05 at 6.09.08 PM (1).jpeg",
    "/WhatsApp Image 2026-04-05 at 6.09.08 PM (2).jpeg",
    "/1.jpeg",
    "/2.jpeg",
    "/3.jpeg",
    "/4.jpeg",
    "/MEP International Conference.jpeg",
    "/Red Sea film 24.jpeg",
    "/Saudi Cargo.jpeg",
    "/TeamLab-digital Art Museum1.jpeg",
    "/TeamLab-digital Art Museum2.jpeg",
    "/TeamLab-digital Art Museum3.jpeg"
  ];

  const certifications = [
    "Project Management Professional (PMP)",
    "IAM Diploma \"Asset management\"",
    "Six Sigma Certified",
    "SCRUM Fundamentals",
    "Certified Maintenance & Reliability Professional (CMRP)",
    "Certified Asset Management Assessor (CAMA)",
    "LEED Green Associate"
  ];

  const insights = [
    {
      type: 'Article',
      title: 'Optimizing Integration of Asset Management & Maintenance Knowledge across Project Phases',
      description: 'Exploring the significance of incorporating asset management principles throughout the project lifecycle, from initiation to closure, to achieve organizational objectives efficiently and sustainably.',
      icon: <FileText className="w-4 h-4" />,
      link: '/Optimizing  Integration of Asset Management & maintenance Knowledge across Project Phases..pdf',
      date: 'Recent'
    },
    {
      type: 'Presentation',
      title: 'Future of Asset Management with Artificial Intelligence (AI)',
      description: 'Transforming Buildings Systems & Infrastructure Through Intelligent Technology. Exploring predictive maintenance, digital twins, and IoT integration.',
      icon: <MonitorPlay className="w-4 h-4" />,
      link: '/Future_of_Asset_Management_with_Artificial_Intelligence_(AI).pdf',
      date: 'Recent'
    },
    {
      type: 'Presentation',
      title: 'MEP Design Strategy Comparison',
      description: 'A detailed comparison between Traditional Strategy and Asset Management Strategy focusing on whole-life-cost, predictive maintenance, and BIM integration.',
      icon: <MonitorPlay className="w-4 h-4" />,
      link: '/MEP Design stratigy ( Traditional vs Asset Managemnt comsideration).pdf',
      date: 'Recent'
    }
  ];

  const [smtpStatus, setSmtpStatus] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  useEffect(() => {
    const checkSmtp = async () => {
      try {
        const res = await fetch('/api/test-email');
        const data = await res.json();
        setSmtpStatus(data);
      } catch (err) {
        setSmtpStatus({ success: false, message: "Server unreachable" });
      }
    };
    checkSmtp();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'} selection:bg-blue-500/30 font-sans overflow-hidden`}>
      {/* SMTP Configuration Warning Overlay */}
      {smtpStatus && !smtpStatus.success && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600/95 backdrop-blur-md text-white px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-4 shadow-2xl border-b border-red-500 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-bold text-sm md:text-base leading-tight">SMTP Configuration Error: Notifications are Disabled</p>
              <p className="text-xs opacity-90 mt-0.5">
                {smtpStatus.error?.includes('535-5.7.8') 
                  ? "Google rejected your login. You MUST use a 16-character 'App Password'." 
                  : "Your server is unable to connect to the email service."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold shadow-sm">
              ACTION REQUIRED
            </div>
            <p className="text-xs font-medium">
              Update <span className="font-bold">SMTP_PASSWORD</span> in Settings with a new App Password
            </p>
          </div>
          <button 
            onClick={() => setSmtpStatus(null)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Animated Background - Using Logo Colors (Blue & Bronze/Amber) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full ${theme === 'dark' ? 'bg-blue-700/20' : 'bg-blue-400/10'} blur-[120px] mix-blend-screen`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full ${theme === 'dark' ? 'bg-amber-600/15' : 'bg-amber-400/10'} blur-[120px] mix-blend-screen`} />
        <motion.div 
          style={{ y }}
          className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${theme === 'dark' ? 'opacity-20' : 'opacity-10'} mix-blend-overlay`}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <img 
              src="/Logo.jpg" 
              alt="Ahmed Abdelrazek Logo" 
              className="h-12 md:h-16 w-auto object-contain"
            />
          </a>
          <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#projects" className="hover:text-blue-600 transition-colors">Projects</a>
            <a href="#news" className="hover:text-blue-600 transition-colors">News</a>
            <a href="#insights" className="hover:text-blue-600 transition-colors">Insights</a>
            <a href="#gallery" className="hover:text-blue-600 transition-colors">Gallery</a>
            <a href="#credentials" className="hover:text-blue-600 transition-colors">Credentials</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a 
              href="#contact"
              className="px-5 py-2.5 rounded-full bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
            >
              Contact Me
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <img 
                src="/Photo.jpg" 
                alt="Ahmed Abdelrazek" 
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 mx-auto object-cover shadow-2xl transition-colors ${theme === 'dark' ? 'border-slate-800' : 'border-white'}`}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm mb-6 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              <MapPin className="w-4 h-4 text-amber-500" />
              Jeddah, Saudi Arabia
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight"
            >
              Ahmed Abdelrazek <br/>
              <span className="text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">
                MEP Director & Project Management Expert
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xl md:text-2xl font-medium mb-8 tracking-wide flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
            >
              <span className="text-green-500 italic">Design for Operation</span>
              <span className={`hidden sm:inline ${theme === 'dark' ? 'text-slate-500' : 'text-slate-300'}`}>|</span>
              <span className="text-orange-500 italic">Build for Value</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Over 20 years of experience leading large-scale MEP, infrastructure, and building projects across Saudi Arabia. Expert in full project lifecycle management, cost and schedule control, stakeholder coordination, and risk mitigation.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4"
            >
              <a 
                href="#services"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-700 text-white font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                Explore My Services
                <ChevronRight className="w-4 h-4" />
              </a>
              <a 
                href="/Ahmed_Abdelrazek_CV.pdf"
                download="Ahmed_Abdelrazek_CV.pdf"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <Download className="w-4 h-4" />
                Download CV
              </a>
              <a 
                href="https://www.linkedin.com/in/ahmed-abdulrazek-82b5a9a1" 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-semibold hover:bg-blue-600/80 transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
              <a 
                href="https://youtube.com/@fekra-aaa?si=oaijW_pBfQ_EhVEd" 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-semibold hover:bg-red-600/80 transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                YouTube
              </a>
            </motion.div>
          </div>
        </section>

        {/* Services Section (First Design Style) */}
        <section id="services" className={`py-32 px-6 transition-colors duration-300 border-y ${theme === 'dark' ? 'bg-slate-950/50 border-white/5' : 'bg-slate-100/50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">My Services & Expertise</h2>
              <p className={`text-lg max-w-2xl transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Comprehensive solutions tailored to your specific needs, backed by over 20 years of industry experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-8 rounded-3xl border transition-all duration-300 group ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xl'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className={`leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Featured Projects</h2>
              <p className={`text-lg transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                A showcase of key projects delivered, highlighting my roles and core responsibilities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xl'}`}
                >
                  <div className="mb-6">
                    <h3 className={`text-2xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{project.name}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
                      <Briefcase className="w-4 h-4" />
                      {project.role}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Key Duties</h4>
                    <ul className={`space-y-3 leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {project.duties.map((duty, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                          <span>{duty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* News Feed Section */}
        {newsItems.length > 0 && (
          <section id="news" className={`py-32 px-6 transition-colors duration-300 border-y ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-100/30 border-slate-200'}`}>
            <div className="max-w-7xl mx-auto">
              <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">News & Updates</h2>
                <p className={`text-lg transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  The latest announcements, project updates, and industry news.
                </p>
              </div>

              <div className="flex flex-col gap-16 max-w-7xl mx-auto">
                {newsItems.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`rounded-[2.5rem] border transition-all duration-500 flex flex-col lg:flex-row group overflow-hidden shadow-2xl items-stretch ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:shadow-blue-500/5' : 'bg-white border-slate-200 hover:shadow-blue-500/10'}`}
                  >
                    {item.imageUrl && (
                      <div className={`w-full lg:w-auto lg:max-w-[50%] xl:max-w-[55%] relative flex items-center justify-center p-6 lg:p-12 border-b lg:border-b-0 lg:border-r shrink-0 min-h-[300px] transition-colors ${theme === 'dark' ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-auto h-auto max-w-full max-h-[500px] lg:max-h-[700px] object-contain transition-transform duration-1000 group-hover:scale-105 drop-shadow-2xl rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className={`p-8 md:p-12 lg:p-16 flex flex-col flex-grow w-full ${item.imageUrl ? 'lg:w-0' : ''}`}>
                      <div className="flex items-center justify-between mb-10">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/20">
                          <Newspaper className="w-4 h-4" />
                          Industry Update
                        </div>
                        <span className={`font-medium text-sm transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.createdAt?.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <h3 
                        dir="auto"
                        className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-8 group-hover:text-blue-400 transition-colors leading-[1.15] tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                      >
                        {item.title}
                      </h3>
                      
                      <div 
                        dir="auto"
                        className={`mb-12 text-lg md:text-xl font-normal opacity-90 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        <ReactMarkdown 
                          components={{
                            p: ({node, ...props}) => <p className="mb-6 leading-relaxed last:mb-0 whitespace-pre-wrap" {...props} />,
                            ul: ({node, ...props}) => <ul className="mb-6 space-y-3 list-none" {...props} />,
                            ol: ({node, ...props}) => <ol className="mb-6 space-y-3 list-decimal pl-5" {...props} />,
                            li: ({node, ...props}) => <li className="leading-relaxed flex items-start gap-3" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-8" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-4 mt-8" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-3 mt-6" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-4" target="_blank" rel="noreferrer" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-slate-400" {...props} />
                          }}
                        >
                          {item.content}
                        </ReactMarkdown>
                      </div>
                      
                      <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                        {item.link ? (
                          <a 
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 text-base font-bold text-white hover:text-blue-400 transition-all group/link"
                          >
                            <span className="relative">
                              Read Full Article
                              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover/link:w-full" />
                            </span>
                            <ExternalLink className="w-5 h-5 transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
                          </a>
                        ) : (
                          <div />
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{Math.ceil(item.content.split(' ').length / 200)} min read</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Insights Section (Articles & Presentations) */}
        <section id="insights" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Articles & Presentations</h2>
              <p className={`text-lg transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Sharing knowledge, industry insights, and best practices from over two decades of experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {insights.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full group ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xl'}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${item.type === 'Article' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {item.icon}
                      {item.type}
                    </div>
                    <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{item.date}</span>
                  </div>
                  <h3 className={`text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`leading-relaxed mb-8 flex-grow transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.description}
                  </p>
                  {item.link !== '#' ? (
                    <button 
                      onClick={() => setSelectedPdf(item.link)}
                      className={`inline-flex items-center gap-2 text-sm font-semibold hover:text-blue-400 transition-colors mt-auto text-left ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                    >
                      {item.type === 'Article' ? 'Read Article' : 'View Presentation'}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className={`inline-flex items-center gap-2 text-sm font-semibold mt-auto ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
                      Coming Soon
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className={`py-32 px-6 transition-colors duration-300 border-t ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-100/30 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Visual Journey</h2>
              <p className={`text-lg mb-8 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                A collection of moments, projects, and milestones from the field.
              </p>
              <button 
                onClick={toggleMusic}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-all duration-500 ${isMusicPlaying ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105' : theme === 'dark' ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:scale-105 shadow-sm'}`}
              >
                {isMusicPlaying ? (
                  <div className="flex items-end gap-1 h-5">
                    <motion.div animate={{ height: ["20%", "100%", "40%", "80%", "20%"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} className="w-1 bg-blue-400 rounded-full" />
                    <motion.div animate={{ height: ["60%", "30%", "100%", "50%", "60%"] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }} className="w-1 bg-blue-400 rounded-full" />
                    <motion.div animate={{ height: ["100%", "40%", "80%", "20%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="w-1 bg-blue-400 rounded-full" />
                    <motion.div animate={{ height: ["40%", "90%", "30%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }} className="w-1 bg-blue-400 rounded-full" />
                  </div>
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
                {isMusicPlaying ? 'Soft Music Playing' : 'Play Background Music'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {galleryPhotos.map((photo, index) => (
                <GalleryImage 
                  key={index}
                  src={photo}
                  alt={`Gallery image ${index + 1}`}
                  index={index}
                  onClick={() => setSelectedPhotoIndex(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Credentials Section */}
        <section id="credentials" className={`py-32 px-6 transition-colors duration-300 border-y ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              
              {/* Certifications */}
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <Award className="w-10 h-10 text-amber-500" />
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Certifications</h2>
                </div>
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-5 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-blue-500 shadow-sm'}`}
                    >
                      <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0" />
                      <span className={`font-medium text-lg transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{cert}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <GraduationCap className="w-10 h-10 text-blue-500" />
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Education</h2>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={`p-8 rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                  <h3 className={`text-2xl font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Bachelor of Mechanical Engineering</h3>
                  <p className="text-blue-400 font-medium mb-4">Power & Energy</p>
                  <div className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-4 h-4" />
                    <span>Egypt</span>
                    <span className="mx-2">•</span>
                    <span>1998</span>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Let's Connect</h2>
              <p className={`text-lg mb-12 max-w-2xl mx-auto transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Whether you have a project in mind or just want to discuss industry trends, I'm always open to connecting.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                <a 
                  href="mailto:ahmed_abd_alrazek@yahoo.com"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold transition-all text-lg shadow-lg ${theme === 'dark' ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-blue-700 text-white hover:bg-blue-600 shadow-blue-700/20'}`}
                >
                  <Mail className="w-5 h-5" />
                  ahmed_abd_alrazek@yahoo.com
                </a>
                <a 
                  href="tel:00966567297258"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold transition-all border text-lg ${theme === 'dark' ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                >
                  <Phone className="w-5 h-5" />
                  +966 56 729 7258
                </a>
              </div>

              <div className="flex items-center justify-center gap-6">
                <a 
                  href="https://www.linkedin.com/in/ahmed-abdulrazek-82b5a9a1" 
                  target="_blank"
                  rel="noreferrer"
                  className={`p-4 rounded-full transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-500 hover:text-white hover:bg-blue-600'}`}
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a 
                  href="https://youtube.com/@fekra-aaa?si=oaijW_pBfQ_EhVEd" 
                  target="_blank"
                  rel="noreferrer"
                  className={`p-4 rounded-full transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-red-600' : 'bg-slate-100 text-slate-500 hover:text-white hover:bg-red-600'}`}
                >
                  <Youtube className="w-6 h-6" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`py-8 px-6 border-t text-center text-sm relative z-10 flex flex-col items-center gap-4 transition-colors ${theme === 'dark' ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-500 bg-white'}`}>
        <p>© {new Date().getFullYear()} Ahmed Abdelrazek. All rights reserved.</p>
        <div className="flex items-center gap-4">
          {visitorCount !== null && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{visitorCount.toLocaleString()} Visitors</span>
            </div>
          )}
          <a 
            href="#admin"
            className="flex items-center gap-2 text-xs bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/30 hover:bg-blue-600/40 transition-colors cursor-pointer font-medium"
            title="Admin Access"
          >
            Admin Dashboard
          </a>
        </div>
      </footer>

      <Chatbot theme={theme} />

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm">
          <div className={`relative w-full max-w-5xl h-full rounded-2xl border overflow-hidden flex flex-col shadow-2xl transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`flex justify-between items-center p-4 border-b shrink-0 transition-colors ${theme === 'dark' ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className={`font-semibold flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-5 h-5 text-blue-400" />
                Document Viewer
              </h3>
              <button 
                onClick={() => {
                  setSelectedPdf(null);
                  setNumPages(undefined);
                }}
                className={`transition-colors p-2 rounded-full ${theme === 'dark' ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 bg-slate-200 hover:bg-slate-300'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`flex-grow w-full h-full relative overflow-y-auto custom-scrollbar p-4 md:p-8 transition-colors ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div className="max-w-4xl mx-auto flex flex-col items-center">
                <Document 
                  file={selectedPdf} 
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={
                    <div className={`flex flex-col items-center gap-4 py-20 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading document...</p>
                    </div>
                  }
                  error={
                    <div className="text-red-400 py-20 text-center">
                      <p>Failed to load PDF file.</p>
                    </div>
                  }
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <div key={`page_${index + 1}`} className="mb-8 shadow-2xl rounded-lg overflow-hidden bg-white">
                      <Page 
                        pageNumber={index + 1} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        width={Math.min(window.innerWidth - 64, 900)}
                        className="max-w-full"
                      />
                    </div>
                  ))}
                </Document>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <button 
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10 z-50"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setSelectedPhotoIndex((prev) => prev === 0 ? galleryPhotos.length - 1 : prev! - 1)}
            className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors p-3 bg-black/50 rounded-full hover:bg-black/80 z-50"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="relative w-full max-w-5xl max-h-[85vh] px-16 flex items-center justify-center">
            <motion.img 
              key={selectedPhotoIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              src={galleryPhotos[selectedPhotoIndex]} 
              alt={`Gallery image ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <button 
            onClick={() => setSelectedPhotoIndex((prev) => prev === galleryPhotos.length - 1 ? 0 : prev! + 1)}
            className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors p-3 bg-black/50 rounded-full hover:bg-black/80 z-50"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="absolute bottom-6 left-0 right-0 text-center text-slate-400 text-sm">
            {selectedPhotoIndex + 1} / {galleryPhotos.length}
          </div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        src="/background-music.mp3" 
        loop 
        preload="auto"
      />
    </div>
  );
}
