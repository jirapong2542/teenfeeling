import React, { useEffect, useMemo, useState } from 'react';
import moonFull from './1.jpg';
import { getMoonPhase } from './moonPhase';
import './TonightMoonPage.css';

function formatTonightTime(date) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function TonightMoonPage({ moodCounts, onNavigateHome, resetCountdownText, tonightCount }) {
  const [now, setNow] = useState(() => new Date());
  const phase = useMemo(() => getMoonPhase(now), [now]);
  const dominantMood = useMemo(() => {
    return [...moodCounts].sort((first, second) => second.count - first.count)[0];
  }, [moodCounts]);
  const sortedMoodCounts = useMemo(() => {
    return [...moodCounts].sort((first, second) => second.count - first.count);
  }, [moodCounts]);
  const shadowShift = Math.round((phase.age / 29.530588853) * 100);
  const dominantMoodText = dominantMood?.count > 0
    ? `${dominantMood.label} ${dominantMood.count} แสง`
    : 'ยังรอแสงแรกของคืนนี้';
  const phasePosition = Math.round((phase.age / 29.530588853) * 100);
  const strongestCount = Math.max(...moodCounts.map((mood) => mood.count), 1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

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
        <div className='tonight-live-strip' aria-label='เวลาปัจจุบันและแสงคืนนี้'>
          <div>
            <span>{formatTonightTime(now)}</span>
            <small>เวลาตอนนี้</small>
          </div>
          <div>
            <span>{phase.illumination}%</span>
            <small>ความสว่าง</small>
          </div>
          <div>
            <span>{tonightCount}</span>
            <small>แสงคืนนี้</small>
          </div>
          <div>
            <span>{resetCountdownText}</span>
            <small>ก่อนเริ่มรอบใหม่</small>
          </div>
        </div>
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

        <div className='tonight-mood-signal' aria-label='อารมณ์ของแสงคืนนี้'>
          <span>moon signals</span>
          {sortedMoodCounts.map((mood) => (
            <div className='mood-signal-row' key={mood.id}>
              <small>{mood.label}</small>
              <div>
                <i
                  style={{
                    '--signal': mood.color,
                    '--signal-width': `${Math.max(8, (mood.count / strongestCount) * 100)}%`,
                  }}
                />
              </div>
              <em>{mood.count}</em>
            </div>
          ))}
        </div>

        <button className='tonight-cta' onClick={onNavigateHome} type='button'>
          ฝากแสงของคืนนี้
        </button>

        <blockquote className='moon-report-quote'>
          คืนนี้พระจันทร์ไม่ได้มีแค่แสงของตัวเอง แต่มีแสงของคนที่แวะมาฝากไว้ด้วย
        </blockquote>
      </div>
    </section>
  );
}

export default TonightMoonPage;
