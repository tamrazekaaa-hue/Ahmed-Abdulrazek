import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, getDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { MessageCircle, LogOut, Clock, User, Eye, Newspaper, Plus, Trash2, Mail, Home, Pencil, X, Sun, Moon, Briefcase } from 'lucide-react';

export default function AdminDashboard({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const [chats, setChats] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'news' | 'projects'>('chats');
  
  // News Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsLink, setNewsLink] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(true);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);
  const [deletingSubscriberId, setDeletingSubscriberId] = useState<string | null>(null);

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [projectRole, setProjectRole] = useState('');
  const [projectDuties, setProjectDuties] = useState('');
  const [projectChallenges, setProjectChallenges] = useState('');
  const [projectSolutions, setProjectSolutions] = useState('');
  const [projectAchievements, setProjectAchievements] = useState('');
  const [projectOrder, setProjectOrder] = useState(0);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const loginInProgress = useRef(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email?.toLowerCase() === 'tamrazek.aaa@gmail.com') {
          setIsAdmin(true);
          setAuthError(null);
          console.log("Admin Dashboard: ACCESS GRANTED");
        } else {
          setIsAdmin(false);
          setAuthError(`Access denied for ${user.email}. You must use the admin account.`);
          console.warn(`Admin Dashboard: ACCESS DENIED for ${user.email}`);
          signOut(auth); // Sign them out so they can try again
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch visitor count
    const fetchVisitorCount = async () => {
      try {
        const visitorRef = doc(db, 'analytics', 'visitors');
        const docSnap = await getDoc(visitorRef);
        if (docSnap.exists()) {
          setVisitorCount(docSnap.data().count);
        }
      } catch (error) {
        console.error("Error fetching visitor count:", error);
      }
    };
    fetchVisitorCount();

    // Fetch Chats
    const qChats = query(collection(db, 'chatSessions'), orderBy('lastUpdatedAt', 'desc'));
    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const now = new Date();
      const validChats = chatData.filter(chat => {
        if (chat.expiresAt) {
          const isExpired = (chat.expiresAt as Timestamp).toDate() < now;
          if (isExpired) {
            // Prune expired chat session
            deleteDoc(doc(db, 'chatSessions', chat.id)).catch(e => console.error("Error pruning chat:", e));
            return false;
          }
        }
        return true;
      });
      
      setChats(validChats);
    });

    // Fetch News
    const qNews = query(collection(db, 'news_feed'), orderBy('createdAt', 'desc'));
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Projects
    const qProjects = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeChats();
      unsubscribeNews();
      unsubscribeProjects();
    };
  }, [isAdmin]);

  const handleLogin = async () => {
    if (loginInProgress.current) return;
    
    loginInProgress.current = true;
    setIsLoggingIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // Ignore this specific error as it just means the user closed the popup
        console.log("Popup closed by user.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Your browser blocked the sign-in popup. Please allow popups for this site and try again.");
      } else {
        alert(`Failed to sign in: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      loginInProgress.current = false;
      setIsLoggingIn(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setNewsImageUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try a different one.");
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            const compressedBase64 = await compressImage(file);
            setNewsImageUrl(compressedBase64);
          } catch (error) {
            console.error("Error compressing pasted image:", error);
          }
        }
        break;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressedBase64 = await compressImage(file);
        setNewsImageUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing dropped image:", error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) return;
    
    setIsSubmittingNews(true);
    try {
      const newsData: any = {
        title: newsTitle,
        content: newsContent,
        updatedAt: new Date()
      };
      if (newsLink) newsData.link = newsLink;
      else newsData.link = ''; // Clear if removed
      if (newsImageUrl) newsData.imageUrl = newsImageUrl;
      else newsData.imageUrl = ''; // Clear if removed
      
      if (editingNewsId) {
        await updateDoc(doc(db, 'news_feed', editingNewsId), newsData);
      } else {
        newsData.createdAt = new Date();
        await addDoc(collection(db, 'news_feed'), newsData);
      }
      
      setNewsTitle('');
      setNewsContent('');
      setNewsLink('');
      setNewsImageUrl('');
      setEditingNewsId(null);
    } catch (error) {
      console.error("Error saving news:", error);
      alert("Failed to save news item.");
    } finally {
      setIsSubmittingNews(false);
    }
  };

  const handleEditNews = (item: any) => {
    setNewsTitle(item.title || '');
    setNewsContent(item.content || '');
    setNewsLink(item.link || '');
    setNewsImageUrl(item.imageUrl || '');
    setEditingNewsId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setNewsTitle('');
    setNewsContent('');
    setNewsLink('');
    setNewsImageUrl('');
    setEditingNewsId(null);
  };

  const confirmDeleteNews = async () => {
    if (!deletingNewsId) return;
    try {
      await deleteDoc(doc(db, 'news_feed', deletingNewsId));
      setDeletingNewsId(null);
    } catch (error) {
      console.error("Error deleting news:", error);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectRole || !projectDuties) return;
    
    setIsSubmittingProject(true);
    try {
      const dutiesList = projectDuties.split('\n').filter(d => d.trim() !== '');
      
      const projectData: any = {
        name: projectName,
        role: projectRole,
        duties: dutiesList,
        order: projectOrder,
        challenges: projectChallenges || '',
        solutions: projectSolutions || '',
        achievements: projectAchievements || ''
      };
      
      if (editingProjectId) {
        await updateDoc(doc(db, 'projects', editingProjectId), projectData);
      } else {
        await addDoc(collection(db, 'projects'), projectData);
      }
      
      setProjectName('');
      setProjectRole('');
      setProjectDuties('');
      setProjectChallenges('');
      setProjectSolutions('');
      setProjectAchievements('');
      setProjectOrder(projects.length + 1);
      setEditingProjectId(null);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project.");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleEditProject = (project: any) => {
    setProjectName(project.name || '');
    setProjectRole(project.role || '');
    setProjectDuties(project.duties ? project.duties.join('\n') : '');
    setProjectChallenges(project.challenges || '');
    setProjectSolutions(project.solutions || '');
    setProjectAchievements(project.achievements || '');
    setProjectOrder(project.order || 0);
    setEditingProjectId(project.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const editId = sessionStorage.getItem('editProjectId');
    if (editId && projects.length > 0) {
      const projectToEdit = projects.find(p => p.id === editId);
      if (projectToEdit) {
        handleEditProject(projectToEdit);
        sessionStorage.removeItem('editProjectId');
      }
    }
  }, [projects]);

  const cancelEditProject = () => {
    setProjectName('');
    setProjectRole('');
    setProjectDuties('');
    setProjectChallenges('');
    setProjectSolutions('');
    setProjectAchievements('');
    setProjectOrder(projects.length);
    setEditingProjectId(null);
  };

  const confirmDeleteProject = async () => {
    if (!deletingProjectId) return;
    try {
      await deleteDoc(doc(db, 'projects', deletingProjectId));
      setDeletingProjectId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  if (loading) return <div className={`p-8 text-center transition-colors ${theme === 'dark' ? 'text-white bg-slate-950' : 'text-slate-900 bg-slate-50'}`}>Loading...</div>;

  if (!isAdmin) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className={`p-8 rounded-2xl border text-center max-w-md w-full transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
          <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin Access Required</h2>
          <p className={`mb-6 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Please log in with your authorized email address to view chat records.</p>
          
          {authError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {authError}
            </div>
          )}

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}`}
          >
            {isLoggingIn ? (
              <>
                <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-slate-900' : 'border-white'}`} />
                Signing in...
              </>
            ) : (
              'Sign in with Google'
            )}
          </button>
          <a href="#" className={`mt-6 inline-block text-sm font-medium transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-blue-600'}`}>
            Return to Website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r flex flex-col h-screen transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b flex flex-col gap-4 transition-colors ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl">Admin Dashboard</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => signOut(auth)} className={`transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-red-600'}`} title="Sign Out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          {visitorCount !== null && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'text-slate-400 bg-slate-800/50 border-white/5' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Total Unique Visitors: <strong className={`transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{visitorCount.toLocaleString()}</strong></span>
            </div>
          )}
          
          <div className="flex flex-col gap-2 mt-4">
            <a 
              href="#"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white border-white/5' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 border-slate-100'}`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Website</span>
            </a>
            
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'chats' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat Records</span>
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'news' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
            >
              <Newspaper className="w-5 h-5" />
              <span className="font-medium">News & Feed</span>
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">Projects</span>
            </button>
          </div>
        </div>
        
        {activeTab === 'chats' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 px-2 transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Active Sessions</h3>
            {chats.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No active chats found.</p>
            ) : (
              chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${selectedChat?.id === chat.id ? 'bg-blue-600/10 border-blue-500/30' : theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800 border-transparent' : 'bg-slate-50 hover:bg-slate-100 border-transparent'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className={`font-medium text-sm truncate transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {chat.visitorInfo?.name || `Visitor ${chat.userId.substring(0, 6)}...`}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Clock className="w-3 h-3" />
                    <span>{chat.lastUpdatedAt?.toDate().toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {chat.messages?.length || 0} messages
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 h-screen flex flex-col overflow-y-auto transition-colors ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
        {activeTab === 'chats' && (
          selectedChat ? (
            <>
              <div className={`p-6 border-b transition-colors ${theme === 'dark' ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'}`}>
                <h3 className={`font-semibold text-lg transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Chat Session Details</h3>
                {selectedChat.visitorInfo && (
                  <div className="my-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Visitor Information</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}><strong>Name:</strong> {selectedChat.visitorInfo.name}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}><strong>Phone:</strong> {selectedChat.visitorInfo.phone}</p>
                    {selectedChat.visitorInfo.email && <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}><strong>Email:</strong> {selectedChat.visitorInfo.email}</p>}
                  </div>
                )}
                <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Started: {selectedChat.createdAt?.toDate().toLocaleString()}</p>
                <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Expires: {selectedChat.expiresAt?.toDate().toLocaleString()}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedChat.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm transition-all ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-md' : theme === 'dark' ? 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                      <div className="font-semibold text-xs mb-1 opacity-50">
                        {msg.role === 'user' ? 'Visitor' : 'AI Assistant'}
                      </div>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a chat from the sidebar to view the conversation.
            </div>
          )
        )}

        {activeTab === 'news' && (
          <div className="p-8 max-w-4xl mx-auto w-full">
            <h2 className={`text-2xl font-bold mb-8 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Manage News & Feed</h2>
            
            <div className={`p-6 rounded-2xl border mb-12 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {editingNewsId ? (
                  <>
                    <Pencil className="w-5 h-5 text-amber-400" />
                    Edit News Item
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-blue-400" />
                    Add New Item
                  </>
                )}
              </h3>
              <form onSubmit={handleAddNews} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Title</label>
                  <input 
                    type="text" 
                    required
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                    placeholder="e.g., New Project Launched"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Content</label>
                  <textarea 
                    required
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                    placeholder="Describe the news or update..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Link (Optional)</label>
                  <input 
                    type="url" 
                    value={newsLink}
                    onChange={(e) => setNewsLink(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                    placeholder="https://..."
                  />
                </div>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors ${theme === 'dark' ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onPaste={handlePaste}
                >
                  <label className={`block text-sm font-medium mb-4 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Image (Optional) - Drag & Drop, Paste, or Select</label>
                  
                  {newsImageUrl ? (
                    <div className="relative w-full max-w-sm mx-auto mb-4">
                      <img src={newsImageUrl} alt="Preview" className="w-full h-auto rounded-lg border border-white/10 shadow-lg" />
                      <button 
                        type="button"
                        onClick={() => setNewsImageUrl('')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Drag and drop an image here, or paste from clipboard</p>
                      <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm transition-colors ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                        Browse Files
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                  
                  <div className={`mt-4 pt-4 border-t transition-colors ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                    <label className="block text-xs text-slate-500 mb-1 text-left">Or provide an image URL:</label>
                    <input 
                      type="url" 
                      value={newsImageUrl.startsWith('data:') ? '' : newsImageUrl}
                      onChange={(e) => setNewsImageUrl(e.target.value)}
                      className={`w-full border rounded-lg px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'}`}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="submit"
                    disabled={isSubmittingNews}
                    className={`${editingNewsId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20`}
                  >
                    {isSubmittingNews ? (editingNewsId ? 'Saving...' : 'Publishing...') : (editingNewsId ? 'Save Changes' : 'Publish News')}
                  </button>
                  {editingNewsId && (
                    <button 
                      type="button"
                      onClick={cancelEdit}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Published News</h3>
            <div className="space-y-4">
              {news.length === 0 ? (
                <p className="text-slate-500">No news items published yet.</p>
              ) : (
                news.map(item => (
                  <div key={item.id} className={`p-6 rounded-2xl border flex justify-between items-start gap-4 transition-all ${editingNewsId === item.id ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-md'}`}>
                    <div>
                      <h4 className={`font-bold text-lg mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                      <p className={`text-sm mb-3 line-clamp-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{item.createdAt?.toDate().toLocaleString()}</span>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                            View Link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleEditNews(item)}
                        className={`p-2 rounded-lg transition-colors ${editingNewsId === item.id ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-400/10'}`}
                        title="Edit News"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setDeletingNewsId(item.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete News"
                        disabled={editingNewsId === item.id}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Briefcase className="w-8 h-8 text-blue-500" />
                <h2 className={`text-3xl font-bold tracking-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Manage Projects</h2>
              </div>

              <div className={`p-6 md:p-8 rounded-3xl border mb-12 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {editingProjectId ? <Pencil className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                  {editingProjectId ? 'Edit Project' : 'Add New Project'}
                </h3>
                <form onSubmit={handleAddProject} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Project Name *</label>
                      <input 
                        type="text" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        placeholder="e.g. Team-lab Project"
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Role *</label>
                      <input 
                        type="text" 
                        value={projectRole}
                        onChange={(e) => setProjectRole(e.target.value)}
                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        placeholder="e.g. MEP Lead & Senior Projects Manager"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Key Duties * (One per line)</label>
                    <textarea 
                      value={projectDuties}
                      onChange={(e) => setProjectDuties(e.target.value)}
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="Lead end-to-end project management...&#10;Managed Design and build project scope..."
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>The Challenge (Optional)</label>
                    <textarea 
                      value={projectChallenges}
                      onChange={(e) => setProjectChallenges(e.target.value)}
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="Describe the specific hurdles faced..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>The Solution (Optional)</label>
                    <textarea 
                      value={projectSolutions}
                      onChange={(e) => setProjectSolutions(e.target.value)}
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="Explain the strategies and actions taken..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Key Achievements (Optional)</label>
                    <textarea 
                      value={projectAchievements}
                      onChange={(e) => setProjectAchievements(e.target.value)}
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="Highlight successful outcomes and metrics..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="submit"
                      disabled={isSubmittingProject}
                      className={`${editingProjectId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20`}
                    >
                      {isSubmittingProject ? (editingProjectId ? 'Saving...' : 'Adding...') : (editingProjectId ? 'Save Changes' : 'Add Project')}
                    </button>
                    {editingProjectId && (
                      <button 
                        type="button"
                        onClick={cancelEditProject}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Existing Projects</h3>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-slate-500">No projects added yet.</p>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className={`p-6 rounded-2xl border flex justify-between items-start gap-4 transition-all ${editingProjectId === project.id ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-md'}`}>
                      <div>
                        <h4 className={`font-bold text-lg mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{project.name}</h4>
                        <p className={`text-sm font-medium mb-3 transition-colors ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{project.role}</p>
                        <p className={`text-sm line-clamp-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {project.duties?.join(' • ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleEditProject(project)}
                          className={`p-2 rounded-lg transition-colors ${editingProjectId === project.id ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-400/10'}`}
                          title="Edit Project"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setDeletingProjectId(project.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Project"
                          disabled={editingProjectId === project.id}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {(deletingNewsId || deletingProjectId) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`border p-6 rounded-2xl max-w-sm w-full shadow-2xl transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Delete {deletingNewsId ? 'News Item' : 'Project'}?
              </h3>
              <p className={`mb-6 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                This action cannot be undone. Are you sure you want to permanently delete this item?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setDeletingNewsId(null);
                    setDeletingProjectId(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={deletingNewsId ? confirmDeleteNews : confirmDeleteProject}
                  className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
