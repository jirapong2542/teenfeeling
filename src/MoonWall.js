import React, { useMemo } from 'react';

function MoonWall({ marks, moodCounts, onOpenComposer, onSelectMark }) {
  const featuredMark = marks[0];
  const visibleMarks = marks.slice(0, 12);
  const totalMarks = Math.max(marks.length, 1);

  const strongestMood = useMemo(() => {
    return moodCounts.reduce((winner, mood) => (mood.count > winner.count ? mood : winner), moodCounts[0]);
  }, [moodCounts]);

  return (
    <section className='moon-wall' id='moon-wall' aria-labelledby='moon-wall-title'>
      <div className='wall-heading'>
        <p className='eyebrow'>moon wall</p>
        <h2 id='moon-wall-title'>แสงล่าสุดจากคนที่มองพระจันทร์ดวงเดียวกัน</h2>
        <p>
          เก็บข้อความที่ถูกฝากไว้ในคืนนี้ให้กลายเป็นผนังแสงเล็ก ๆ กดเลือกข้อความเพื่อดูบนพระจันทร์
          หรือสร้าง Story card ของแสงนั้นได้ทันที
        </p>
      </div>

      {featuredMark && (
        <button
          className='featured-whisper'
          onClick={() => onSelectMark(featuredMark)}
          style={{ '--light': featuredMark.mood.color, '--glow': featuredMark.mood.glow }}
          type='button'
        >
          <span className='featured-label'>แสงล่าสุด</span>
          <strong>"{featuredMark.message}"</strong>
          <span className='featured-meta'>
            {featuredMark.mood.label} / {featuredMark.time}
          </span>
        </button>
      )}

      <div className='wall-layout'>
        <div className='wall-grid' aria-label='Latest moon messages'>
          {visibleMarks.map((mark) => (
            <button
              className='wall-card'
              key={mark.id}
              onClick={() => onSelectMark(mark)}
              style={{ '--light': mark.mood.color, '--glow': mark.mood.glow }}
              type='button'
            >
              <span className='wall-card-light' />
              <span className='wall-card-message'>"{mark.message}"</span>
              <span className='wall-card-meta'>
                {mark.mood.label} / {mark.time}
              </span>
            </button>
          ))}
        </div>

        <aside className='wall-insight' aria-label='Mood insight'>
          <span className='panel-kicker'>คืนนี้เด่นสุด</span>
          <strong>{strongestMood.label}</strong>
          <p>{strongestMood.count} จาก {marks.length} แสงบนพระจันทร์ตอนนี้</p>

          <div className='mood-bars'>
            {moodCounts.map((mood) => (
              <div className='mood-bar' key={mood.id}>
                <span>{mood.label}</span>
                <div>
                  <i style={{ '--light': mood.color, width: `${(mood.count / totalMarks) * 100}%` }} />
                </div>
                <em>{mood.count}</em>
              </div>
            ))}
          </div>

          <button className='wall-action' onClick={onOpenComposer} type='button'>
            ฝากแสงของคุณเพิ่ม
          </button>
        </aside>
      </div>
    </section>
  );
}

export default MoonWall;
