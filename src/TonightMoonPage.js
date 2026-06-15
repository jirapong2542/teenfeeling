import React, { useMemo } from 'react';
import moonFull from './1.jpg';
import { getMoonPhase } from './moonPhase';

function TonightMoonPage({ moodCounts, onNavigateHome, tonightCount }) {
  const phase = useMemo(() => getMoonPhase(), []);
  const dominantMood = useMemo(() => {
    return [...moodCounts].sort((first, second) => second.count - first.count)[0];
  }, [moodCounts]);
  const shadowShift = Math.round((phase.age / 29.530588853) * 100);
  const dominantMoodText = dominantMood?.count > 0
    ? `${dominantMood.label} ${dominantMood.count} แสง`
    : 'ยังรอแสงแรกของคืนนี้';
  const phasePosition = Math.round((phase.age / 29.530588853) * 100);

  return (
    <section className='tonight-moon-page' id='tonight-moon' aria-label='Tonight moon phase'>
      <nav className='tonight-page-nav' aria-label='Tonight moon navigation'>
        <button onClick={onNavigateHome} type='button'>
          กลับไปฝากแสง
        </button>
        <span>t__n_f__ling / moon observatory</span>
      </nav>

      <div className='tonight-moon-orbit' aria-hidden='true'>
        <span />
        <span />
        <span />
      </div>

      <div className='tonight-moon-copy'>
        <p className='eyebrow'>moon observatory</p>
        <h2>พระจันทร์คืนนี้</h2>
        <p>
          ไม่ใช่แค่ phase ของท้องฟ้า แต่เป็นรายงานของคืนนี้ ว่าพระจันทร์กำลังสว่างแค่ไหน
          และมีคนฝากแสงไว้ใต้ฟ้าเดียวกันกี่ดวง
        </p>
      </div>

      <div className='tonight-moon-visual-card'>
        <span className='phase-caption'>{phase.illuminationText}</span>
        <div
          className='tonight-phase-moon'
          style={{
            '--phase-shadow': `${shadowShift}%`,
            '--illumination': `${phase.illumination}%`,
          }}
          aria-hidden='true'
        >
          <img src={moonFull} alt='' />
        </div>
        <div className='phase-ring' aria-hidden='true' />
        <div className='phase-track' aria-hidden='true'>
          <span style={{ '--phase-position': `${phasePosition}%` }} />
        </div>
      </div>

      <div className='tonight-moon-report'>
        <span className='report-kicker'>current phase</span>
        <strong>{phase.thaiName}</strong>
        <em>{phase.name}</em>
        <p>{phase.tone}</p>

        <div className='phase-metrics'>
          <div>
            <span>{phase.illumination}%</span>
            <small>illumination</small>
          </div>
          <div>
            <span>{phase.ageText}</span>
            <small>moon age</small>
          </div>
          <div>
            <span>{phase.nextFullMoonDateText}</span>
            <small>{phase.nextFullMoonText}</small>
          </div>
        </div>

        <div className='tonight-feeling-card'>
          <span>คืนนี้บนเว็บ</span>
          <strong>{tonightCount}</strong>
          <small>รอยแสงที่ถูกฝากไว้</small>
          <p>{dominantMoodText}</p>
        </div>

        <blockquote className='moon-report-quote'>
          คืนนี้พระจันทร์ไม่ได้มีแค่แสงของตัวเอง แต่มีแสงของคนที่แวะมาฝากไว้ด้วย
        </blockquote>
      </div>
    </section>
  );
}

export default TonightMoonPage;
