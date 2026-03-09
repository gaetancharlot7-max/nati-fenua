import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Film, Camera, MapPin, X, Upload, Sparkles, Hash, ImagePlus, Shield, Navigation, Loader2, Link2, Youtube, Newspaper } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { postsApi, storiesApi, uploadApi } from '../lib/api';
import { toast } from 'sonner';
import { PrivacySelector, PrivacyPolicyModal } from '../components/PrivacySettings';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [postType, setPostType] = useState('photo');
  const [formData, setFormData] = useState({
    media_url: '',
    caption: '',
    location: '',
    privacy: 'public',
    coordinates: null,
    external_link: '',
    link_type: null
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    return localStorage.getItem('privacy_accepted') === 'true';
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);

  useEffect(() => {
    if (!privacyAccepted) {
      setShowPrivacyPolicy(true);
    }
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
        setLocationEnabled(true);
        
        // Reverse geocoding to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'Polynésie Française';
          setFormData(prev => ({
            ...prev,
            location: locationName
          }));
          toast.success(`Localisation activée : ${locationName}`);
        } catch (error) {
          setFormData(prev => ({
            ...prev,
            location: 'Polynésie Française'
          }));
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Impossible d\'obtenir votre position');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const postTypes = [
    { id: 'photo', icon: Image, label: 'Photo', description: 'Partagez une image' },
    { id: 'video', icon: Film, label: 'Vidéo', description: 'Publiez une vidéo' },
    { id: 'reel', icon: Sparkles, label: 'Reel', description: 'Vidéo courte verticale' },
    { id: 'story', icon: Camera, label: 'Story', description: 'Disparaît après 24h' },
    { id: 'link', icon: Link2, label: 'Lien', description: 'YouTube, articles, etc.' }
  ];

  // Parse YouTube URL to get video ID
  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Detect link type
  const detectLinkType = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'article';
  };

  // Handle external link change
  const handleExternalLinkChange = (url) => {
    const linkType = detectLinkType(url);
    setFormData(prev => ({ ...prev, external_link: url, link_type: linkType }));
    
    if (linkType === 'youtube') {
      const videoId = getYoutubeVideoId(url);
      if (videoId) {
        setLinkPreview({
          type: 'youtube',
          videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        });
        setPreviewUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        setFormData(prev => ({ 
          ...prev, 
          media_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          external_link: url,
          link_type: 'youtube'
        }));
      }
    } else if (linkType === 'article') {
      setLinkPreview({ type: 'article', url });
      // For articles, we'll use a placeholder or og:image
      setFormData(prev => ({ 
        ...prev, 
        external_link: url,
        link_type: 'article'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.media_url && !formData.external_link) {
      toast.error('Veuillez ajouter un média ou un lien');
      return;
    }

    setLoading(true);

    try {
      if (postType === 'story') {
        await storiesApi.create({
          media_url: formData.media_url,
          media_type: 'photo'
        });
        toast.success('Story publiée !');
      } else {
        await postsApi.create({
          content_type: postType === 'link' ? 'link' : postType,
          media_url: formData.media_url || formData.external_link,
          caption: formData.caption,
          location: formData.location,
          coordinates: formData.coordinates,
          external_link: formData.external_link,
          link_type: formData.link_type
        });
        toast.success('Publication créée ! Vos amis seront notifiés.');
      }
      navigate('/feed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (url) => {
    setFormData({ ...formData, media_url: url });
    setPreviewUrl(url);
  };

  // Handle file upload from device
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux. Maximum 50MB.');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const response = await uploadApi.uploadFile(file);
      if (response.data.success) {
        setFormData({ ...formData, media_url: response.data.url });
        toast.success('Fichier téléchargé !');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  };

  // Demo images for quick selection
  const demoImages = [
    'https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=600',
    'https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=600',
    'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=600',
    'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=600'
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-[#2F2F31]">Créer</h1>
          <Button 
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Post Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {postTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setPostType(type.id)}
              data-testid={`post-type-${type.id}`}
              className={`p-4 rounded-2xl text-left transition-all ${
                postType === type.id 
                  ? 'bg-[#00899B] text-white' 
                  : 'bg-white text-[#2F2F31] hover:bg-[#F5E6D3]'
              }`}
            >
              <type.icon size={24} className="mb-2" />
              <p className="font-medium">{type.label}</p>
              <p className={`text-xs ${postType === type.id ? 'text-white/70' : 'text-gray-500'}`}>
                {type.description}
              </p>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* External Link Section (for link type) */}
          {postType === 'link' && (
            <div className="space-y-3">
              <Label className="text-[#1A1A2E]">Lien externe</Label>
              <div className="space-y-3">
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    data-testid="external-link-input"
                    placeholder="https://youtube.com/watch?v=... ou URL d'article"
                    value={formData.external_link}
                    onChange={(e) => handleExternalLinkChange(e.target.value)}
                    className="pl-12 py-6 rounded-xl"
                  />
                </div>
                
                {/* Link Type Indicators */}
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                    formData.link_type === 'youtube' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Youtube size={14} /> YouTube
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                    formData.link_type === 'article' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Newspaper size={14} /> Article
                  </span>
                </div>

                {/* YouTube Preview */}
                {linkPreview?.type === 'youtube' && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100">
                    <img 
                      src={linkPreview.thumbnail}
                      alt="YouTube video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkPreview(null);
                        setFormData(prev => ({ ...prev, external_link: '', link_type: null, media_url: '' }));
                        setPreviewUrl('');
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {/* Article Preview */}
                {linkPreview?.type === 'article' && formData.external_link && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Newspaper size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A2E] truncate">Article partagé</p>
                        <p className="text-xs text-gray-500 truncate">{formData.external_link}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkPreview(null);
                          setFormData(prev => ({ ...prev, external_link: '', link_type: null }));
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-200"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Optional: Add an image to go with the link */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Ajouter une image (optionnel)</p>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          {(postType !== 'link' || (postType === 'link' && !linkPreview?.thumbnail)) && (
          <div className="space-y-3">
            <Label className="text-[#1A1A2E]">{postType === 'link' ? 'Image personnalisée' : 'Ajouter un média'}</Label>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            
            {/* Upload buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="py-8 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] text-white flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ImagePlus size={28} />
                )}
                <span className="text-sm font-medium">
                  {uploading ? 'Téléchargement...' : 'Depuis votre appareil'}
                </span>
              </Button>
              
              <Button
                type="button"
                onClick={() => {
                  const url = prompt('Collez l\'URL de votre image ou vidéo:');
                  if (url) handleUrlChange(url);
                }}
                variant="outline"
                className="py-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#FF6B35] flex flex-col items-center gap-2"
              >
                <Upload size={28} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Via URL</span>
              </Button>
            </div>
            
            {/* Quick Select Demo Images */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Ou choisissez une image de démonstration :</p>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {demoImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUrlChange(url)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      previewUrl === url ? 'border-[#FF6B35]' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
              <img 
                src={previewUrl} 
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl('')}
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl('');
                  setFormData({ ...formData, media_url: '' });
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Caption */}
          {postType !== 'story' && (
            <div className="space-y-3">
              <Label className="text-[#1A1A2E]">Légende</Label>
              <Textarea
                data-testid="caption-input"
                placeholder="Écrivez une légende... #FenuaSocial #Polynésie"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="min-h-[120px] rounded-xl resize-none"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Hash size={12} />
                Utilisez des hashtags pour plus de visibilité
              </p>
            </div>
          )}

          {/* Location */}
          {postType !== 'story' && (
            <div className="space-y-3">
              <Label className="text-[#1A1A2E]">Lieu</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    data-testid="location-input"
                    placeholder="Ajouter un lieu"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-12 py-6 rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className={`px-4 py-6 rounded-xl transition-all ${
                    locationEnabled 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gradient-to-r from-[#00CED1] to-[#006994] hover:from-[#00B5B5] hover:to-[#005580] text-white'
                  }`}
                >
                  {gettingLocation ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : locationEnabled ? (
                    <MapPin size={20} />
                  ) : (
                    <Navigation size={20} />
                  )}
                </Button>
              </div>
              {locationEnabled && formData.coordinates && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <MapPin size={12} />
                  Localisation activée - Vos amis pourront voir où vous êtes
                </p>
              )}
            </div>
          )}

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label className="text-[#1A1A2E]">Confidentialité</Label>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gray-500" />
                <span className="text-sm text-gray-700">Qui peut voir ce contenu ?</span>
              </div>
              <PrivacySelector
                value={formData.privacy}
                onChange={(value) => setFormData({ ...formData, privacy: value })}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            data-testid="publish-btn"
            disabled={loading || uploading || !formData.media_url || !privacyAccepted}
            className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] text-white font-medium"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {postType === 'story' ? 'Publier la Story' : 'Partager'}
              </>
            )}
          </Button>
        </form>

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal
          isOpen={showPrivacyPolicy}
          onClose={() => setShowPrivacyPolicy(false)}
          onAccept={() => {
            localStorage.setItem('privacy_accepted', 'true');
            setPrivacyAccepted(true);
          }}
        />
      </motion.div>
    </div>
  );
};

export default CreatePostPage;
