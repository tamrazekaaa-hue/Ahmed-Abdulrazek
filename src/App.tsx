import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
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
  Youtube
} from 'lucide-react';
import Chatbot from './components/Chatbot';

export default function App() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

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

  const certifications = [
    "Project Management Professional (PMP)",
    "IAM Diploma \"Asset management\"",
    "Six Sigma Certified",
    "SCRUM Fundamentals",
    "Certified Maintenance & Reliability Professional (CMRP)",
    "Certified Asset Management Assessor (CAMA)",
    "LEED Green Associate"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans overflow-hidden">
      {/* Animated Background - Using Logo Colors (Blue & Bronze/Amber) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-700/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/15 blur-[120px] mix-blend-screen" />
        <motion.div 
          style={{ y }}
          className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <img 
              src="/Logo.jpg" 
              alt="Ahmed Abdelrazek Logo" 
              className="h-12 md:h-16 w-auto object-contain"
            />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#projects" className="hover:text-blue-600 transition-colors">Projects</a>
            <a href="#credentials" className="hover:text-blue-600 transition-colors">Credentials</a>
          </div>
          <a 
            href="#contact"
            className="px-5 py-2.5 rounded-full bg-blue-700 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
          >
            Contact Me
          </a>
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
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-800 mx-auto object-cover shadow-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-6"
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
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-orange-500 italic">Build for Value</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg md:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
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
        <section id="services" className="py-32 px-6 bg-slate-950/50 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">My Services & Expertise</h2>
              <p className="text-slate-400 text-lg max-w-2xl">
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
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
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
              <p className="text-slate-400 text-lg">
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
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col h-full"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
                      <Briefcase className="w-4 h-4" />
                      {project.role}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Key Duties</h4>
                    <ul className="space-y-3 text-slate-400 leading-relaxed">
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

        {/* Credentials Section */}
        <section id="credentials" className="py-32 px-6 bg-slate-900/50 border-y border-white/5">
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
                      className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0" />
                      <span className="font-medium text-slate-200 text-lg">{cert}</span>
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
                  className="p-8 rounded-3xl bg-white/5 border border-white/10"
                >
                  <h3 className="text-2xl font-semibold text-white mb-2">Bachelor of Mechanical Engineering</h3>
                  <p className="text-blue-400 font-medium mb-4">Power & Energy</p>
                  <div className="flex items-center gap-2 text-slate-400">
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
              <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
                Whether you have a project in mind or just want to discuss industry trends, I'm always open to connecting.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                <a 
                  href="mailto:ahmed_abd_alrazek@yahoo.com"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-slate-950 font-semibold hover:bg-slate-200 transition-colors text-lg"
                >
                  <Mail className="w-5 h-5" />
                  ahmed_abd_alrazek@yahoo.com
                </a>
                <a 
                  href="tel:00966567297258"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/10 text-lg"
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
                  className="p-4 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-blue-600 transition-all"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a 
                  href="https://youtube.com/@fekra-aaa?si=oaijW_pBfQ_EhVEd" 
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-red-600 transition-all"
                >
                  <Youtube className="w-6 h-6" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-slate-500 text-sm relative z-10">
        <p>© {new Date().getFullYear()} Ahmed Abdelrazek. All rights reserved.</p>
      </footer>

      <Chatbot />
    </div>
  );
}
