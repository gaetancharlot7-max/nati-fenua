import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Flame, Laugh, Sparkles } from 'lucide-react';

// Reaction types with emojis and colors
const REACTIONS = [
  { type: 'like', emoji: '👍', icon: ThumbsUp, color: '#3B82F6', label: 'J\'aime' },
  { type: 'love', emoji: '❤️', icon: Heart, color: '#EF4444', label: 'J\'adore' },
  { type: 'fire', emoji: '🔥', icon: Flame, color: '#F97316', label: 'Feu' },
  { type: 'haha', emoji: '😂', icon: Laugh, color: '#EAB308', label: 'Haha' },
  { type: 'wow', emoji: '✨', icon: Sparkles, color: '#8B5CF6', label: 'Wow' },
];

// Reaction Button with hover selector
export const ReactionButton = ({ 
  currentReaction = null, 
  reactionsCount = 0,
  onReact,
  size = 'normal' // 'small' | 'normal' | 'large'
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef(null);
  const buttonRef = useRef(null);

  const sizes = {
    small: { button: 'p-1.5', icon: 18, picker: 'scale-90' },
    normal: { button: 'p-2', icon: 24, picker: 'scale-100' },
    large: { button: 'p-3', icon: 28, picker: 'scale-110' }
  };

  const currentSize = sizes[size];
  const activeReaction = currentReaction ? REACTIONS.find(r => r.type === currentReaction) : null;

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 300);
  };

  const handleReaction = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  const handleClick = () => {
    // Quick tap = toggle like
    if (currentReaction) {
      onReact(null); // Remove reaction
    } else {
      onReact('like'); // Add like
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-full transition-all duration-200 ${currentSize.button} ${
          activeReaction 
            ? 'text-white' 
            : 'text-[#1A1A2E] hover:bg-gray-100'
        }`}
        style={activeReaction ? { backgroundColor: activeReaction.color } : {}}
        data-testid="reaction-btn"
      >
        {activeReaction ? (
          <span className="text-lg">{activeReaction.emoji}</span>
        ) : (
          <Heart size={currentSize.icon} />
        )}
        {reactionsCount > 0 && (
          <span className={`font-semibold ${activeReaction ? 'text-white' : 'text-[#1A1A2E]'}`}>
            {reactionsCount}
          </span>
        )}
      </button>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-full left-0 mb-2 z-50 ${currentSize.picker}`}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setShowPicker(true);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-1 px-2 py-2 bg-white rounded-full shadow-xl border border-gray-100">
              {REACTIONS.map((reaction, index) => (
                <motion.button
                  key={reaction.type}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleReaction(reaction.type)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all hover:scale-125 ${
                    currentReaction === reaction.type ? 'bg-gray-100 ring-2 ring-offset-1' : ''
                  }`}
                  style={currentReaction === reaction.type ? { ringColor: reaction.color } : {}}
                  title={reaction.label}
                  data-testid={`reaction-${reaction.type}`}
                >
                  <span className="text-2xl">{reaction.emoji}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reaction Summary (shows who reacted)
export const ReactionSummary = ({ reactions = {}, totalCount = 0 }) => {
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (totalCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1">
        {topReactions.map(([type]) => {
          const reaction = REACTIONS.find(r => r.type === type);
          return (
            <span 
              key={type}
              className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs shadow-sm border border-gray-100"
            >
              {reaction?.emoji}
            </span>
          );
        })}
      </div>
      <span className="text-sm text-gray-500">
        {totalCount} {totalCount === 1 ? 'réaction' : 'réactions'}
      </span>
    </div>
  );
};

export default ReactionButton;
