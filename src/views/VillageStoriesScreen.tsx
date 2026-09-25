import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { StoryItem } from '../types';
import { Flame, Plus, User, ShieldCheck, Heart, Share2, MessageSquare } from 'lucide-react';
import { getEffectiveUserId, triggerHapticFeedback } from '../services/deviceIdentity';
import { CommentsModal } from './CommentsModal';

export const VillageStoriesScreen: React.FC = () => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [commentsStory, setCommentsStory] = useState<StoryItem | null>(null);

  const effectiveUid = getEffectiveUserId(currentUser);

  // New story state
  const [title, setTitle] = useState('');
  const [teller, setTeller] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    return dbService.subscribeStories(setStories);
  }, []);

  const handleLike = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    triggerHapticFeedback();
    await dbService.toggleLikeStory(storyId, effectiveUid);
  };

  const handleShare = (e: React.MouseEvent, story: StoryItem) => {
    e.stopPropagation();
    triggerHapticFeedback();
    const sTitle = language === 'kn' ? story.title_kn : story.title_en;
    const text = `📖 *${sTitle}* - ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಕಥೆ:\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: sTitle, text, url: window.location.href }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !content.trim()) return;

    await dbService.addStory({
      title_en: title,
      title_kn: title,
      storyteller_en: teller || currentUser.name,
      storyteller_kn: teller || currentUser.name,
      content_en: content,
      content_kn: content,
      category: 'HERO',
      type: 'COMMUNITY_STORY',
      author_id: currentUser.uid,
      verified: true
    });

    setTitle('');
    setTeller('');
    setContent('');
    setShowSubmitModal(false);
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '840px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಗ್ರಾಮದ ಕಥೆಗಳು & ನೆನಪುಗಳು' : 'Village Stories & Resident Lore'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಹಿರಿಯರ ನೆನಪುಗಳು, ಸುಗ್ಗಿಯ ಕಾಲದ ರೋಚಕ ಕ್ಷಣಗಳು ಹಾಗೂ ಸಾಂಪ್ರದಾಯಿಕ ಕಥೆಗಳು'
              : 'Memories of village elders, resilience tales, and community folklore'}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>{isKannada ? 'ಕಥೆ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share a Memory'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {stories.map((story) => {
          const sTitle = language === 'kn' ? story.title_kn : story.title_en;
          const sContent = language === 'kn' ? story.content_kn : story.content_en;
          const sTeller = language === 'kn' ? story.storyteller_kn : story.storyteller_en;
          const isLiked = Array.isArray(story.liked_by) && story.liked_by.includes(effectiveUid);

          return (
            <article key={story.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-community">
                  <Flame size={12} />
                  {story.type.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {story.created_at}
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.35 }}>
                {sTitle}
              </h2>

              <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600, display: 'block', marginBottom: '14px' }}>
                🎙️ {sTeller}
              </span>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 14px 0' }}>
                {sContent}
              </p>

              {/* Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '14px',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Like button */}
                  <button
                    type="button"
                    onClick={(e) => handleLike(e, story.id)}
                    style={{
                      background: isLiked ? 'rgba(239, 68, 68, 0.16)' : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${isLiked ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 12px',
                      color: isLiked ? '#EF4444' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      minHeight: '36px',
                      transition: 'all 0.15s ease'
                    }}
                    title={isLiked ? 'Liked' : 'Like'}
                  >
                    <Heart
                      size={15}
                      fill={isLiked ? '#EF4444' : 'none'}
                      color={isLiked ? '#EF4444' : 'currentColor'}
                      style={{ animation: isLiked ? 'heartPop 0.3s ease' : 'none' }}
                    />
                    <span>{story.likes_count || 0}</span>
                  </button>

                  {/* Comment button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommentsStory(story);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 12px',
                      color: '#38BDF8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      minHeight: '36px',
                      transition: 'all 0.15s ease'
                    }}
                    title={isKannada ? 'ಪ್ರತಿಕ್ರಿಯೆಗಳು' : 'Comments'}
                  >
                    <MessageSquare size={15} />
                    <span>{story.comments_count || 0}</span>
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={(e) => handleShare(e, story)}
                    style={{
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 12px',
                      color: '#22C55E',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      minHeight: '36px',
                      transition: 'all 0.15s ease'
                    }}
                    title={isKannada ? 'ವಾಟ್ಸಾಪ್ / ಹಂಚಿಕೊಳ್ಳಿ' : 'Share'}
                  >
                    <Share2 size={14} />
                    <span>{isKannada ? 'ಹಂಚಿ' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              {isKannada ? 'ಗ್ರಾಮದ ನೆನಪನ್ನು ಹಂಚಿಕೊಳ್ಳಿ' : 'Share a Village Memory / Story'}
            </h3>

            <form onSubmit={handleAddStory}>
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಕಥೆಯ ಶೀರ್ಷಿಕೆ' : 'Story Title *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How our school was built in 1952"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಕಥೆ ಹೇಳಿದ ಹಿರಿಯರು (ಮೂಲ)' : 'Storyteller Name / Source *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={teller}
                  onChange={(e) => setTeller(e.target.value)}
                  placeholder="e.g. As told by Subbanna (Age 84)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಸಂಪೂರ್ಣ ಕಥೆ / ವಿವರ' : 'The Full Story *'}</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the memoir or story here..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal for Stories */}
      <CommentsModal
        news={commentsStory}
        isOpen={!!commentsStory}
        onClose={() => setCommentsStory(null)}
        onOpenReportModal={() => {}}
      />
    </div>
  );
};
