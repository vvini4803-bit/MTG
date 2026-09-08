import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { StoryItem } from '../types';
import { Flame, Plus, User, ShieldCheck, Heart, Share2 } from 'lucide-react';

export const VillageStoriesScreen: React.FC = () => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New story state
  const [title, setTitle] = useState('');
  const [teller, setTeller] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    return dbService.subscribeStories(setStories);
  }, []);

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

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {sContent}
              </p>
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
    </div>
  );
};
