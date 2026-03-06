import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { postsApi, storiesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ContentType = 'post' | 'story' | 'reel' | 'live';

interface ContentOption {
  type: ContentType;
  icon: string;
  label: string;
  description: string;
  colors: string[];
}

const contentOptions: ContentOption[] = [
  {
    type: 'post',
    icon: 'image',
    label: 'Publication',
    description: 'Partagez une photo ou vidéo',
    colors: ['#FF6B35', '#FF8C61']
  },
  {
    type: 'story',
    icon: 'circle',
    label: 'Story',
    description: 'Contenu éphémère 24h',
    colors: ['#FF1493', '#FF69B4']
  },
  {
    type: 'reel',
    icon: 'film',
    label: 'Reel',
    description: 'Vidéo courte créative',
    colors: ['#9400D3', '#BA55D3']
  },
  {
    type: 'live',
    icon: 'video',
    label: 'Live',
    description: 'Diffusion en direct',
    colors: ['#00CED1', '#20B2AA']
  }
];

// Content Type Card
const ContentTypeCard = ({ 
  option, 
  isSelected, 
  onSelect 
}: { 
  option: ContentOption; 
  isSelected: boolean; 
  onSelect: () => void;
}) => (
  <TouchableOpacity
    style={[styles.typeCard, isSelected && styles.typeCardSelected]}
    onPress={onSelect}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={option.colors}
      style={styles.typeIconContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Icon name={option.icon} size={24} color="white" />
    </LinearGradient>
    <View style={styles.typeInfo}>
      <Text style={styles.typeLabel}>{option.label}</Text>
      <Text style={styles.typeDescription}>{option.description}</Text>
    </View>
    {isSelected && (
      <View style={styles.checkmark}>
        <Icon name="check" size={16} color="white" />
      </View>
    )}
  </TouchableOpacity>
);

// Main Create Screen
const CreateScreen = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ContentType>('post');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!content.trim() && !mediaUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter du contenu ou une image');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedType === 'post') {
        await postsApi.create({
          content: content.trim(),
          media_url: mediaUrl.trim() || null,
          media_type: mediaUrl ? 'image' : null
        });
        Alert.alert('Succès', 'Publication créée avec succès !');
      } else if (selectedType === 'story') {
        await storiesApi.create({
          media_url: mediaUrl.trim() || 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=600',
          media_type: 'image'
        });
        Alert.alert('Succès', 'Story créée avec succès !');
      } else {
        Alert.alert('Info', `La création de ${selectedType} sera bientôt disponible !`);
      }
      
      // Reset form
      setContent('');
      setMediaUrl('');
    } catch (error) {
      console.error('Error creating content:', error);
      Alert.alert('Erreur', 'Impossible de créer le contenu. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Créer</Text>
          <TouchableOpacity 
            style={[styles.publishBtn, isSubmitting && styles.publishBtnDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            <Text style={styles.publishText}>
              {isSubmitting ? 'Publication...' : 'Publier'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <Image
            source={{ uri: user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=FF6B35&color=fff` }}
            style={styles.userAvatar}
          />
          <View>
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userLocation}>{user?.location || 'Polynésie Française'}</Text>
          </View>
        </View>

        {/* Content Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de contenu</Text>
          <View style={styles.typeCards}>
            {contentOptions.map((option) => (
              <ContentTypeCard
                key={option.type}
                option={option}
                isSelected={selectedType === option.type}
                onSelect={() => setSelectedType(option.type)}
              />
            ))}
          </View>
        </View>

        {/* Content Input */}
        {(selectedType === 'post' || selectedType === 'reel') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre message</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Partagez ce qui vous inspire..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={2000}
            />
            <Text style={styles.charCount}>{content.length}/2000</Text>
          </View>
        )}

        {/* Media URL Input (placeholder for file picker) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Média</Text>
          <View style={styles.mediaSection}>
            <TouchableOpacity style={styles.mediaButton}>
              <LinearGradient
                colors={['#FF6B35', '#FF1493']}
                style={styles.mediaButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="camera" size={24} color="white" />
                <Text style={styles.mediaButtonText}>Prendre une photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaButton}>
              <View style={styles.mediaButtonOutline}>
                <Icon name="image" size={24} color="#FF6B35" />
                <Text style={styles.mediaButtonTextOutline}>Galerie</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* URL input as fallback */}
          <TextInput
            style={styles.urlInput}
            placeholder="Ou collez une URL d'image..."
            placeholderTextColor="#9CA3AF"
            value={mediaUrl}
            onChangeText={setMediaUrl}
          />

          {/* Media Preview */}
          {mediaUrl ? (
            <View style={styles.mediaPreview}>
              <Image
                source={{ uri: mediaUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeMedia}
                onPress={() => setMediaUrl('')}
              >
                <Icon name="x" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Live specific options */}
        {selectedType === 'live' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration du live</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Titre de votre live..."
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
            />
            <View style={styles.liveOptions}>
              <TouchableOpacity style={styles.liveOption}>
                <Icon name="users" size={20} color="#1A1A2E" />
                <Text style={styles.liveOptionText}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.liveOption}>
                <Icon name="lock" size={20} color="#1A1A2E" />
                <Text style={styles.liveOptionText}>Privé</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  publishBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  publishBtnDisabled: {
    opacity: 0.6
  },
  publishText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700'
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 12
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  userLocation: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12
  },
  typeCards: {
    gap: 10
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8
  },
  typeCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F0'
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  typeInfo: {
    flex: 1
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  typeDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1A1A2E',
    minHeight: 120,
    textAlignVertical: 'top'
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8
  },
  mediaSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  mediaButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden'
  },
  mediaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8
  },
  mediaButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  mediaButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 14,
    backgroundColor: 'white'
  },
  mediaButtonTextOutline: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600'
  },
  urlInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1A1A2E'
  },
  mediaPreview: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6'
  },
  removeMedia: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  liveOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  liveOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    gap: 8
  },
  liveOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E'
  }
});

export default CreateScreen;
