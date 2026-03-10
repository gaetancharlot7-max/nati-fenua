import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, User, MapPin, FileText, ArrowLeft, Save, X, Eye, EyeOff, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || 'Polynésie Française'
  });
  const [visibility, setVisibility] = useState({
    show_photos: user?.profile_visibility?.show_photos ?? true,
    show_posts: user?.profile_visibility?.show_posts ?? true,
    is_private: user?.profile_visibility?.is_private ?? false
  });
  const [previewImage, setPreviewImage] = useState(user?.picture || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_URL}/api/account`, {
        withCredentials: true
      });
      toast.success('Votre compte a été supprimé');
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression du compte');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Update visibility settings
  const handleVisibilityChange = async (key, value) => {
    const newVisibility = { ...visibility, [key]: value };
    setVisibility(newVisibility);
    
    try {
      await axios.put(
        `${API_URL}/api/users/visibility`,
        { [key]: value },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5 Mo');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('location', formData.location);
      
      if (selectedFile) {
        formDataToSend.append('picture', selectedFile);
      }

      const response = await axios.put(
        `${API_URL}/api/users/me`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      if (response.data) {
        toast.success('Profil mis à jour avec succès !');
        if (refreshUser) {
          await refreshUser();
        }
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} className="text-[#1A1A2E]" />
        </button>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Modifier le profil</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Profile Picture */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <Label className="text-gray-700 font-medium mb-4 block">Photo de profil</Label>
          <div className="flex flex-col items-center">
            <div 
              onClick={handleImageClick}
              className="relative cursor-pointer group"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FF6B35]">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
                    <User size={48} className="text-white" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center shadow-lg">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-3">Cliquez pour changer la photo</p>
          </div>
        </div>

        {/* Name */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <Label htmlFor="name" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <User size={18} className="text-[#FF6B35]" />
            Nom
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Votre nom"
            data-testid="edit-name-input"
            className="rounded-xl border-gray-200 focus:border-[#FF6B35] py-6"
          />
        </div>

        {/* Bio */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <Label htmlFor="bio" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <FileText size={18} className="text-[#FF6B35]" />
            Bio / Description
          </Label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Parlez de vous... (ex: Passionné de surf, amoureux de Tahiti 🌺)"
            data-testid="edit-bio-input"
            rows={4}
            maxLength={300}
            className="w-full rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] p-4 resize-none transition-colors"
          />
          <p className="text-sm text-gray-400 mt-2 text-right">{formData.bio.length}/300</p>
        </div>

        {/* Location */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <Label htmlFor="location" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-[#FF6B35]" />
            Localisation
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Votre localisation"
            data-testid="edit-location-input"
            className="rounded-xl border-gray-200 focus:border-[#FF6B35] py-6"
          />
        </div>

        {/* Profile Visibility Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <Label className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Lock size={18} className="text-[#FF6B35]" />
            Visibilité du profil
          </Label>
          
          <div className="space-y-4">
            {/* Show Photos Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-[#1A1A2E]">Afficher les photos</p>
                  <p className="text-sm text-gray-500">Les visiteurs peuvent voir vos photos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleVisibilityChange('show_photos', !visibility.show_photos)}
                className={`w-12 h-7 rounded-full transition-all ${
                  visibility.show_photos ? 'bg-[#FF6B35]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  visibility.show_photos ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Show Posts Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-[#1A1A2E]">Afficher les publications</p>
                  <p className="text-sm text-gray-500">Les visiteurs peuvent voir vos posts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleVisibilityChange('show_posts', !visibility.show_posts)}
                className={`w-12 h-7 rounded-full transition-all ${
                  visibility.show_posts ? 'bg-[#FF6B35]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  visibility.show_posts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Private Profile Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-[#1A1A2E]">Profil privé</p>
                  <p className="text-sm text-gray-500">Seuls vos amis peuvent voir votre contenu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleVisibilityChange('is_private', !visibility.is_private)}
                className={`w-12 h-7 rounded-full transition-all ${
                  visibility.is_private ? 'bg-[#FF6B35]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  visibility.is_private ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 py-6 rounded-2xl border-gray-200"
          >
            <X size={20} className="mr-2" />
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            data-testid="save-profile-btn"
            className="flex-1 py-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>

        {/* Delete Account Section */}
        <div className="bg-red-50 rounded-3xl p-6 border border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-700 mb-1">Supprimer mon compte</h3>
              <p className="text-sm text-red-600/70 mb-4">
                Cette action est irréversible. Toutes vos données, photos, vidéos et messages seront définitivement supprimés.
              </p>
              
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="delete-account-btn"
                  className="border-red-300 text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={18} className="mr-2" />
                  Supprimer mon compte
                </Button>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-red-300">
                  <div className="flex items-center gap-2 text-red-600 mb-3">
                    <AlertTriangle size={20} />
                    <span className="font-medium">Êtes-vous sûr ?</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Tapez "SUPPRIMER" pour confirmer la suppression définitive de votre compte.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      data-testid="confirm-delete-btn"
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      {deleteLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Supprimer définitivement'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  );
};

export default EditProfilePage;
