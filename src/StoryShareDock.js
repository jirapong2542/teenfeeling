import React, { useEffect, useState } from 'react';
import { STORY_THEMES, createStoryBlob, getStoryCaption } from './storyCard';

function StoryShareDock({ moonImage, mark, onClose }) {
  const [status, setStatus] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState(STORY_THEMES[0].id);
  const selectedTheme = STORY_THEMES.find((theme) => theme.id === selectedThemeId) || STORY_THEMES[0];

  useEffect(() => {
    setStatus('');
  }, [mark?.id]);

  if (!mark) {
    return null;
  }

  const downloadStory = async () => {
    try {
      setIsSharing(true);
      setStatus('กำลังสร้างภาพสำหรับ Story...');
      const blob = await createStoryBlob(mark, selectedThemeId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moon-light-${selectedThemeId}-${mark.id}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 600);
      setStatus('ดาวน์โหลดภาพแล้ว เปิด Instagram แล้วอัปลง Story ได้เลย');
    } catch {
      setStatus('สร้างภาพไม่สำเร็จ ลองกดอีกครั้งนะ');
    } finally {
      setIsSharing(false);
    }
  };

  const shareStory = async () => {
    try {
      setIsSharing(true);
      setStatus('กำลังสร้างภาพสำหรับ Instagram Story...');
      const blob = await createStoryBlob(mark, selectedThemeId);
      const file = new File([blob], `moon-light-${selectedThemeId}-${mark.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'ฝากแสงไว้บนพระจันทร์',
          text: getStoryCaption(mark),
        });
        setStatus('เปิดหน้าต่างแชร์แล้ว เลือก Instagram หรือ Stories ได้เลย');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moon-light-${selectedThemeId}-${mark.id}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 600);
      setStatus('เครื่องนี้แชร์ตรงไม่ได้ เลยดาวน์โหลดภาพให้แทน');
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('ยกเลิกการแชร์แล้ว');
        return;
      }

      setStatus('แชร์ไม่สำเร็จ ลองดาวน์โหลดภาพแล้วอัปลง Story แทน');
    } finally {
      setIsSharing(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(getStoryCaption(mark));
      setStatus('คัดลอกแคปชันแล้ว');
    } catch {
      setStatus('คัดลอกไม่ได้บน browser นี้');
    }
  };

  return (
    <div className='story-dock' aria-live='polite'>
      <button className='story-dock-close' onClick={onClose} type='button'>
        ปิด
      </button>
      <div className={`story-preview theme-${selectedThemeId}`}>
        <span className='story-brand'>leave a light</span>
        <img src={moonImage} alt='' />
        <span
          className='story-light'
          style={{
            '--x': `${mark.x}%`,
            '--y': `${mark.y}%`,
            '--light': mark.mood.color,
          }}
        />
        <div className='story-copy'>
          <p>"{mark.message}"</p>
          <span>ฝากไว้บนพระจันทร์ / @t__n_f__ling</span>
        </div>
      </div>

      <div className='story-actions'>
        <div className='story-theme-picker' aria-label='เลือกธีม Story'>
          {STORY_THEMES.map((theme) => (
            <button
              aria-pressed={selectedThemeId === theme.id}
              className={selectedThemeId === theme.id ? 'theme-chip active' : 'theme-chip'}
              disabled={isSharing}
              key={theme.id}
              onClick={() => {
                setSelectedThemeId(theme.id);
                setStatus('');
              }}
              type='button'
            >
              <span>{theme.label}</span>
              <small>{theme.description}</small>
            </button>
          ))}
        </div>
        <p className='selected-theme-note'>ธีมที่เลือก: {selectedTheme.label}</p>
        <p>{status || 'กดแชร์บนมือถือ แล้วเลือก Instagram หรือ Stories จาก share sheet'}</p>
        <button className='story-action-primary' disabled={isSharing} onClick={shareStory} type='button'>
          {isSharing ? 'กำลังสร้างภาพ...' : 'แชร์ลง IG Story'}
        </button>
        <button disabled={isSharing} onClick={downloadStory} type='button'>
          ดาวน์โหลด PNG
        </button>
        <button disabled={isSharing} onClick={copyCaption} type='button'>
          คัดลอกแคปชัน
        </button>
      </div>
    </div>
  );
}

export default StoryShareDock;
