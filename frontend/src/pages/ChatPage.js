import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Smile, Phone, Video, MoreVertical, ArrowLeft, Search } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { chatApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Demo conversations
const demoConversations = [
  {
    conversation_id: 'conv1',
    other_user: { user_id: '1', name: 'Hinano', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100' },
    last_message: 'Ia ora na ! Comment ça va ?',
    last_message_at: new Date(Date.now() - 300000).toISOString(),
    unread: 2
  },
  {
    conversation_id: 'conv2',
    other_user: { user_id: '2', name: 'Maeva Shop', picture: 'https://ui-avatars.com/api/?name=MS&background=FF6B35&color=fff&bold=true' },
    last_message: 'Votre commande est prête 📦',
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    unread: 0
  },
  {
    conversation_id: 'conv3',
    other_user: { user_id: '3', name: 'Teva Explorer', picture: 'https://ui-avatars.com/api/?name=TE&background=00CED1&color=fff&bold=true' },
    last_message: 'Magnifique ta dernière photo !',
    last_message_at: new Date(Date.now() - 7200000).toISOString(),
    unread: 0
  }
];

// Demo messages
const demoMessages = [
  { message_id: 'm1', sender_id: '1', content: 'Ia ora na ! 👋', created_at: new Date(Date.now() - 600000).toISOString() },
  { message_id: 'm2', sender_id: 'me', content: 'Ia ora na ! Ça va bien et toi ?', created_at: new Date(Date.now() - 500000).toISOString() },
  { message_id: 'm3', sender_id: '1', content: 'Super ! Tu viens au Heiva ce weekend ?', created_at: new Date(Date.now() - 400000).toISOString() },
  { message_id: 'm4', sender_id: 'me', content: 'Oui bien sûr ! 🎉', created_at: new Date(Date.now() - 300000).toISOString() },
  { message_id: 'm5', sender_id: '1', content: 'Parfait on se retrouve là-bas alors !', created_at: new Date(Date.now() - 200000).toISOString() }
];

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState(demoConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      if (response.data?.length > 0) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await chatApi.getMessages(conversationId);
      if (response.data?.length > 0) {
        setMessages(response.data);
      } else {
        setMessages(demoMessages);
      }
    } catch (error) {
      setMessages(demoMessages);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const tempMessage = {
      message_id: `temp_${Date.now()}`,
      sender_id: user?.user_id || 'me',
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      await chatApi.sendMessage({
        receiver_id: selectedConversation.other_user.user_id,
        content: newMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return formatTime(date);
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="h-[calc(100vh-56px)] lg:h-[calc(100vh-64px)] flex bg-white lg:rounded-3xl lg:m-4 lg:shadow-xl overflow-hidden">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-[#1A1A2E] mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Rechercher une conversation..."
              className="pl-10 rounded-xl bg-gray-100 border-0"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <motion.button
              key={conv.conversation_id}
              onClick={() => setSelectedConversation(conv)}
              data-testid={`conversation-${conv.conversation_id}`}
              className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-all ${
                selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gradient-to-r from-[#FF6B35]/10 to-transparent' : ''
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={conv.other_user?.picture} />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold">
                    {conv.other_user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#1A1A2E] truncate">{conv.other_user?.name}</p>
                  <span className="text-xs text-gray-400">{formatDate(conv.last_message_at)}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread > 0 ? 'text-[#1A1A2E] font-medium' : 'text-gray-500'}`}>
                  {conv.last_message}
                </p>
              </div>
              
              {conv.unread > 0 && (
                <div className="min-w-[24px] h-6 px-2 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold flex items-center justify-center">
                  {conv.unread}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100"
              >
                <ArrowLeft size={24} />
              </button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedConversation.other_user?.picture} />
                <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold">
                  {selectedConversation.other_user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-[#1A1A2E]">{selectedConversation.other_user?.name}</p>
                <p className="text-xs text-green-500">En ligne</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Phone size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Video size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical size={20} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => {
              const isMe = message.sender_id === user?.user_id || message.sender_id === 'me';
              
              return (
                <motion.div
                  key={message.message_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                    <div className={`px-4 py-3 ${
                      isMe 
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-2xl rounded-br-md' 
                        : 'bg-white text-[#1A1A2E] rounded-2xl rounded-bl-md shadow-sm'
                    }`}>
                      <p className="text-[15px]">{message.content}</p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl flex-shrink-0">
                <Image size={22} className="text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl flex-shrink-0">
                <Smile size={22} className="text-gray-500" />
              </Button>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez un message..."
                data-testid="message-input"
                className="flex-1 rounded-xl bg-gray-100 border-0 py-6"
              />
              
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                data-testid="send-message-btn"
                className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white px-6 py-6 disabled:opacity-50"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-[#FF6B35]/20 to-[#00CED1]/20 flex items-center justify-center">
              <Send size={40} className="text-[#FF6B35]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Vos messages</h3>
            <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
