import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Smile, MoreVertical, ArrowLeft, Search, X, Plus, MessageCircle, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { chatApi, usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Liste d'emojis populaires polynésiens et généraux
const EMOJI_LIST = [
  '🌺', '🌴', '🌊', '🐚', '🥥', '🍍', '🌸', '🦋', '🐠', '🐬',
  '☀️', '🌅', '🏝️', '⛵', '🎣', '🏄', '🤙', '💪', '🔥', '✨',
  '😀', '😊', '😍', '🥰', '😎', '🤩', '😂', '🤣', '😇', '🙂',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖',
  '👍', '👏', '🙏', '💪', '✌️', '🤝', '👋', '🎉', '🎊', '🎁',
  '🌈', '⭐', '🌙', '🌟', '💫', '🔆', '🎵', '🎶', '📸', '🎬'
];

// Conversations vides par défaut (chargées depuis l'API)
const demoConversations = [];

// Messages vides par défaut
const demoMessages = [];

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  const [conversations, setConversations] = useState(demoConversations);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showConvMenu, setShowConvMenu] = useState(null);
  
  // New states for user search
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Delete conversation
  const deleteConversation = async (convId) => {
    try {
      await chatApi.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.conversation_id !== convId));
      if (selectedConversation?.conversation_id === convId) {
        setSelectedConversation(null);
      }
      setShowConvMenu(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Si on arrive avec un paramètre ?user=, créer ou ouvrir une conversation avec cet utilisateur
  useEffect(() => {
    const openConversationWithUser = async () => {
      if (targetUserId && user) {
        try {
          // Chercher si une conversation existe déjà
          const existingConv = conversations.find(
            conv => conv.other_user.user_id === targetUserId
          );
          
          if (existingConv) {
            setSelectedConversation(existingConv);
            setMessages(demoMessages);
          } else {
            // Récupérer les infos de l'utilisateur et créer une nouvelle conversation
            const userRes = await usersApi.getProfile(targetUserId);
            const newConv = {
              conversation_id: `conv_new_${Date.now()}`,
              other_user: {
                user_id: targetUserId,
                name: userRes.data.name,
                picture: userRes.data.picture
              },
              last_message: '',
              last_message_at: new Date().toISOString(),
              unread: 0
            };
            setConversations(prev => [newConv, ...prev]);
            setSelectedConversation(newConv);
            setMessages([]);
          }
        } catch (error) {
          console.error('Error opening conversation:', error);
        }
      }
    };
    
    openConversationWithUser();
  }, [targetUserId, user]);

  // Fermer le picker emoji si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Search users with debounce
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.length < 2) {
        setUserSearchResults([]);
        return;
      }
      
      setSearchingUsers(true);
      try {
        const response = await usersApi.searchUsers(userSearchQuery);
        // Filter out current user and existing conversation users
        const filteredResults = (response.data || []).filter(u => 
          u.user_id !== user?.user_id
        );
        setUserSearchResults(filteredResults.slice(0, 8)); // Limit to 8 results
      } catch (error) {
        console.error('Error searching users:', error);
        setUserSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, user?.user_id]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setUserSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Start conversation with selected user
  const startConversationWithUser = async (selectedUser) => {
    // Check if conversation already exists
    const existingConv = conversations.find(
      conv => conv.other_user?.user_id === selectedUser.user_id
    );
    
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create new conversation
      const newConv = {
        conversation_id: `conv_new_${Date.now()}`,
        other_user: {
          user_id: selectedUser.user_id,
          name: selectedUser.name,
          picture: selectedUser.picture
        },
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread: 0
      };
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setMessages([]);
    }
    
    // Reset search
    setShowNewConversation(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

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

  // Poll online status of conversation partners every 20s
  useEffect(() => {
    const partnerIds = conversations
      .map((c) => c.other_user?.user_id)
      .filter(Boolean);
    if (partnerIds.length === 0) return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await usersApi.getOnlineStatus(partnerIds);
        if (!cancelled) setOnlineUserIds(new Set(res.data?.online || []));
      } catch {
        // silent
      }
    };
    refresh();
    const interval = setInterval(refresh, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversations]);

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
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return;

    const messageContent = selectedImage 
      ? `[Image] ${newMessage}`.trim() 
      : newMessage;

    const tempMessage = {
      message_id: `temp_${Date.now()}`,
      sender_id: user?.user_id || 'me',
      content: messageContent,
      media_url: imagePreview,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    removeSelectedImage();

    try {
      await chatApi.sendMessage({
        receiver_id: selectedConversation.other_user.user_id,
        content: messageContent,
        message_type: selectedImage ? 'image' : 'text',
        media_url: imagePreview
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-[#1A1A2E]">Messages</h1>
            <Button
              onClick={() => setShowNewConversation(!showNewConversation)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:opacity-90 p-0"
              data-testid="new-conversation-btn"
            >
              <Plus size={20} className="text-white" />
            </Button>
          </div>
          
          {/* New Conversation Search */}
          <AnimatePresence>
            {showNewConversation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="relative" ref={searchInputRef}>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6B35]" size={18} />
                  <Input 
                    placeholder="Rechercher un utilisateur..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10 pr-10 rounded-xl bg-[#FF6B35]/10 border-[#FF6B35]/30 focus:border-[#FF6B35] text-[#1A1A2E]"
                    data-testid="user-search-input"
                    autoFocus
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => {
                        setUserSearchQuery('');
                        setUserSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {(userSearchResults.length > 0 || searchingUsers) && (
                  <div 
                    ref={searchResultsRef}
                    className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto"
                    data-testid="user-search-results"
                  >
                    {searchingUsers ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin w-5 h-5 border-2 border-[#FF6B35] border-t-transparent rounded-full mx-auto mb-2"></div>
                        Recherche en cours...
                      </div>
                    ) : (
                      userSearchResults.map((searchUser) => (
                        <motion.button
                          key={searchUser.user_id}
                          onClick={() => startConversationWithUser(searchUser)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#FF6B35]/10 transition-colors text-left"
                          whileHover={{ x: 4 }}
                          data-testid={`user-result-${searchUser.user_id}`}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={searchUser.picture} />
                            <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-sm">
                              {searchUser.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A1A2E] truncate">{searchUser.name}</p>
                            <p className="text-xs text-gray-500 truncate">@{searchUser.username || searchUser.name?.toLowerCase().replace(/\s/g, '')}</p>
                          </div>
                          <MessageCircle size={18} className="text-[#FF6B35]" />
                        </motion.button>
                      ))
                    )}
                    
                    {!searchingUsers && userSearchResults.length === 0 && userSearchQuery.length >= 2 && (
                      <div className="p-4 text-center text-gray-500">
                        <User size={24} className="mx-auto mb-2 opacity-50" />
                        Aucun utilisateur trouvé
                      </div>
                    )}
                  </div>
                )}
                
                {userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Tapez au moins 2 caractères pour rechercher
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Conversation Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Filtrer les conversations..."
              className="pl-10 rounded-xl bg-gray-100 border-0"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucune conversation</p>
              <p className="text-sm mt-1">Cliquez sur + pour démarrer une conversation</p>
            </div>
          ) : (
            conversations.map((conv) => (
            <motion.div
              key={conv.conversation_id}
              data-testid={`conversation-${conv.conversation_id}`}
              className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-all cursor-pointer relative ${
                selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gradient-to-r from-[#FF6B35]/10 to-transparent' : ''
              }`}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={conv.other_user?.picture} />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold">
                    {conv.other_user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator - shows only when partner is currently connected */}
                {onlineUserIds.has(conv.other_user?.user_id) && (
                  <div
                    data-testid={`online-dot-${conv.other_user?.user_id}`}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                  ></div>
                )}
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1A1A2E] truncate">
                    {conv.other_user?.name}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(conv.last_message_at)}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread > 0 ? 'text-[#1A1A2E] font-medium' : 'text-gray-500'}`}>
                  {conv.last_message || 'Démarrer la conversation...'}
                </p>
              </div>
              
              {conv.unread > 0 && (
                <div className="min-w-[24px] h-6 px-2 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold flex items-center justify-center">
                  {conv.unread}
                </div>
              )}
              
              {/* Menu 3 points */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConvMenu(showConvMenu === conv.conversation_id ? null : conv.conversation_id);
                  }}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <MoreVertical size={18} className="text-gray-500" />
                </button>
                
                {showConvMenu === conv.conversation_id && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[160px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.conversation_id);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <X size={16} />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
          )}
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
              <Link to={`/profile/${selectedConversation.other_user?.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.other_user?.picture} />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold">
                    {selectedConversation.other_user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[#1A1A2E]">{selectedConversation.other_user?.name}</p>
                  {onlineUserIds.has(selectedConversation.other_user?.user_id) ? (
                    <p className="text-xs text-green-500">En ligne</p>
                  ) : (
                    <p className="text-xs text-gray-400">Hors ligne</p>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 3-dots menu with conversation actions */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConvMenu(showConvMenu === selectedConversation.conversation_id ? null : selectedConversation.conversation_id);
                  }}
                  data-testid="chat-header-menu"
                  aria-label="Options"
                >
                  <MoreVertical size={20} className="pointer-events-none" />
                </Button>
                {showConvMenu === selectedConversation.conversation_id && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConvMenu(null);
                        deleteConversation(selectedConversation.conversation_id);
                      }}
                      data-testid="chat-header-delete"
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <X size={16} className="pointer-events-none" />
                      Supprimer la conversation
                    </button>
                  </div>
                )}
              </div>
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
                      {message.media_url && (
                        <img 
                          src={message.media_url} 
                          alt="Message image" 
                          className="max-w-full rounded-lg mb-2"
                        />
                      )}
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
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-32 rounded-xl border border-gray-200"
                />
                <button
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3 relative">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl flex-shrink-0 hover:bg-[#FF6B35]/10"
                onClick={() => fileInputRef.current?.click()}
                data-testid="image-picker-btn"
              >
                <Image size={22} className="text-[#FF6B35]" />
              </Button>
              
              <div className="relative" ref={emojiPickerRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl flex-shrink-0 hover:bg-[#FFD700]/10"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  data-testid="emoji-picker-btn"
                >
                  <Smile size={22} className="text-[#FFD700]" />
                </Button>
                
                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-72 z-50"
                    >
                      <p className="text-xs text-gray-500 mb-2 font-medium">Emojis populaires</p>
                      <div className="grid grid-cols-10 gap-1">
                        {EMOJI_LIST.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => addEmoji(emoji)}
                            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
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
                disabled={!newMessage.trim() && !selectedImage}
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
