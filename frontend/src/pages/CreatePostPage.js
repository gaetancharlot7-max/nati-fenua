import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Film, Camera, MapPin, X, Upload, Sparkles, Hash } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { postsApi, storiesApi } from '../lib/api';
import { toast } from 'sonner';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [postType, setPostType] = useState('photo');
  const [formData, setFormData] = useState({
    media_url: '',
    caption: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const postTypes = [
    { id: 'photo', icon: Image, label: 'Photo', description: 'Partagez une image' },
    { id: 'video', icon: Film, label: 'Vidéo', description: 'Publiez une vidéo' },
    { id: 'reel', icon: Sparkles, label: 'Reel', description: 'Vidéo courte verticale' },
    { id: 'story', icon: Camera, label: 'Story', description: 'Disparaît après 24h' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.media_url) {
      toast.error('Veuillez ajouter un média');
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
          content_type: postType,
          media_url: formData.media_url,
          caption: formData.caption,
          location: formData.location
        });
        toast.success('Publication créée !');
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
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
          {/* Media URL Input */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">URL du média</Label>
            <div className="relative">
              <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                data-testid="media-url-input"
                placeholder="Collez l'URL de votre image ou vidéo"
                value={formData.media_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="pl-12 py-6 rounded-xl"
              />
            </div>
            
            {/* Quick Select Demo Images */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {demoImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleUrlChange(url)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    previewUrl === url ? 'border-[#00899B]' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

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
              <Label className="text-[#2F2F31]">Légende</Label>
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
              <Label className="text-[#2F2F31]">Lieu</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  data-testid="location-input"
                  placeholder="Ajouter un lieu"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="pl-12 py-6 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            data-testid="publish-btn"
            disabled={loading || !formData.media_url}
            className="w-full py-6 rounded-xl bg-[#00899B] hover:bg-[#007585] text-white font-medium"
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
      </motion.div>
    </div>
  );
};

export default CreatePostPage;
