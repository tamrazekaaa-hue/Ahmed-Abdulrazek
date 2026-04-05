import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { MessageCircle, LogOut, Clock, User } from 'lucide-react';

export default function AdminDashboard() {
  const [chats, setChats] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'tamrazek.AAA@gmail.com') {
        setIsAdmin(true);
        console.log("Admin Dashboard: ACCESS GRANTED");
      } else {
        setIsAdmin(false);
        if (user) console.warn(`Admin Dashboard: ACCESS DENIED for ${user.email}`);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'chatSessions'), orderBy('lastUpdatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Filter out expired chats (older than 3 days)
      const now = new Date();
      const validChats = chatData.filter(chat => {
        if (chat.expiresAt) {
          return (chat.expiresAt as Timestamp).toDate() > now;
        }
        return true;
      });
      
      setChats(validChats);
    }, (error) => {
      console.error("Error fetching chats:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
          <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">Please log in with your authorized email address to view chat records.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-slate-900 font-medium py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-slate-900 border-r border-white/10 flex flex-col h-screen">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-bold text-xl">Chat Records</h2>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No active chats found.</p>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 rounded-xl transition-colors ${selectedChat?.id === chat.id ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-sm truncate">Visitor {chat.userId.substring(0, 6)}...</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen flex flex-col bg-slate-950">
        {selectedChat ? (
          <>
            <div className="p-6 border-b border-white/10 bg-slate-900/50">
              <h3 className="font-semibold text-lg">Chat Session Details</h3>
              <p className="text-sm text-slate-400">Started: {selectedChat.createdAt?.toDate().toLocaleString()}</p>
              <p className="text-sm text-slate-400">Expires: {selectedChat.expiresAt?.toDate().toLocaleString()}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedChat.messages?.map((msg: any, idx: number) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none'}`}>
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
        )}
      </div>
    </div>
  );
}
