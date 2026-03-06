import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { chatApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Conversation item component
const ConversationItem = ({ conversation, onPress }: { conversation: any; onPress: () => void }) => (
  <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: conversation.participant?.picture || `https://ui-avatars.com/api/?name=${conversation.participant?.name}&background=FF6B35&color=fff` }}
        style={styles.avatar}
      />
      {conversation.is_online && <View style={styles.onlineDot} />}
    </View>
    <View style={styles.conversationInfo}>
      <View style={styles.conversationHeader}>
        <Text style={styles.participantName}>{conversation.participant?.name}</Text>
        <Text style={styles.timestamp}>{conversation.last_message_time || 'Maintenant'}</Text>
      </View>
      <Text style={styles.lastMessage} numberOfLines={1}>
        {conversation.last_message || 'Commencez une conversation'}
      </Text>
    </View>
    {conversation.unread_count > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadCount}>{conversation.unread_count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Main Chat Screen
const ChatScreen = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock conversations
  const mockConversations = [
    {
      conversation_id: '1',
      participant: { name: 'Maeva Tahiti', is_verified: true },
      last_message: 'Ia ora na ! Comment vas-tu ?',
      last_message_time: '2 min',
      unread_count: 2,
      is_online: true
    },
    {
      conversation_id: '2',
      participant: { name: 'Mana Band', is_verified: true },
      last_message: 'Le concert de ce soir va être incroyable !',
      last_message_time: '15 min',
      unread_count: 0,
      is_online: false
    },
    {
      conversation_id: '3',
      participant: { name: 'Perles Noires PF', is_verified: false },
      last_message: 'Votre commande est prête 🖤',
      last_message_time: '1h',
      unread_count: 1,
      is_online: true
    },
    {
      conversation_id: '4',
      participant: { name: 'Chef Moana', is_verified: false },
      last_message: 'Mauruuru pour la recette !',
      last_message_time: '3h',
      unread_count: 0,
      is_online: false
    },
    {
      conversation_id: '5',
      participant: { name: 'Heiva Official', is_verified: true },
      last_message: 'Félicitations pour votre performance !',
      last_message_time: 'Hier',
      unread_count: 0,
      is_online: false
    }
  ];

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      const fetched = response.data.conversations || [];
      setConversations(fetched.length > 0 ? fetched : mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations(mockConversations);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationPress = (conversation: any) => {
    // Navigate to chat detail (would use navigation in real app)
    console.log('Open conversation:', conversation.conversation_id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatBtn}>
          <Icon name="edit" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Online Users */}
      <View style={styles.onlineSection}>
        <Text style={styles.onlineTitle}>En ligne</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={conversations.filter(c => c.is_online)}
          keyExtractor={(item) => `online-${item.conversation_id}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.onlineUser}>
              <View style={styles.onlineAvatarContainer}>
                <Image
                  source={{ uri: item.participant?.picture || `https://ui-avatars.com/api/?name=${item.participant?.name}&background=FF6B35&color=fff` }}
                  style={styles.onlineAvatar}
                />
                <View style={styles.onlineIndicator} />
              </View>
              <Text style={styles.onlineName} numberOfLines={1}>
                {item.participant?.name?.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.onlineList}
        />
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.conversation_id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
            />
          )}
          contentContainerStyle={styles.conversationsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="message-circle" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune conversation</Text>
              <Text style={styles.emptySubtext}>Commencez à discuter avec vos amis</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E'
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    marginLeft: 10
  },
  onlineSection: {
    marginBottom: 16
  },
  onlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  onlineList: {
    paddingHorizontal: 16
  },
  onlineUser: {
    alignItems: 'center',
    marginRight: 16
  },
  onlineAvatarContainer: {
    position: 'relative'
  },
  onlineAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F3F4F6'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF5E6'
  },
  onlineName: {
    marginTop: 6,
    fontSize: 12,
    color: '#1A1A2E',
    fontWeight: '500',
    maxWidth: 60,
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  conversationsList: {
    paddingBottom: 100
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F3F4F6'
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'white'
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  lastMessage: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF'
  }
});

export default ChatScreen;
