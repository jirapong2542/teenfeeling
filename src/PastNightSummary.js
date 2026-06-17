import React, { useEffect, useMemo, useState } from 'react';
import { fetchPreviousNightSummary, getPreviousNightRange } from './moonMarksApi';
import { getMoonPhase } from './moonPhase';
import { isSupabaseConfigured } from './supabaseClient';
import './PastNightSummary.css';

function formatNightDate(isoText) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoText));
}

function createEmptySummary(moods) {
  const range = getPreviousNightRange();

  return {
    count: 0,
    dominantMood: null,
    moodCounts: moods.map((mood) => ({ ...mood, count: 0 })),
    phaseDate: new Date(range.start.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    sampleMessages: [],
    startIso: range.startIso,
    endIso: range.endIso,
  };
}

function PastNightSummary({ moods }) {
  const [summary, setSummary] = useState(() => createEmptySummary(moods));
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'local');
  const phase = useMemo(() => getMoonPhase(new Date(summary.phaseDate)), [summary.phaseDate]);
  const strongestCount = Math.max(...summary.moodCounts.map((mood) => mood.count), 1);
  const nightLabel = `${formatNightDate(summary.startIso)} - ${formatNightDate(summary.endIso)}`;

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      setStatus(isSupabaseConfigured ? 'loading' : 'local');
      const result = await fetchPreviousNightSummary(moods);

      if (!isMounted) {
        return;
      }

      setSummary(result.summary);
      setStatus(result.error ? 'local' : 'ready');
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [moods]);

  const dominantMoodText = summary.dominantMood
    ? `${summary.dominantMood.label} ${summary.dominantMood.count} แสง`
    : 'ยังไม่มี mood เด่นจากคืนที่ผ่านมา';

  return (
    <section className='past-night-summary' aria-label='สรุปคืนที่ผ่านมา'>
      <div className='past-night-heading'>
        <span>last night archive</span>
        <strong>สรุปคืนที่ผ่านมา</strong>
        <small>{nightLabel}</small>
      </div>

      <div className='past-night-grid'>
        <div className='past-night-main-stat'>
          <span>จำนวนแสง</span>
          <strong>{status === 'loading' ? '...' : summary.count}</strong>
          <small>{status === 'local' ? 'รอข้อมูลจริงจาก Supabase' : 'แสงที่ถูกฝากไว้ในคืนก่อน'}</small>
        </div>

        <div className='past-night-detail'>
          <span>mood เด่น</span>
          <strong>{dominantMoodText}</strong>
          <small>คำนวณจากวันที่บันทึกจริง และแยกคืนตามรอบรีเซ็ต 06:00</small>
        </div>

        <div className='past-night-detail'>
          <span>phase วันนั้น</span>
          <strong>{phase.thaiName}</strong>
          <small>{phase.illuminationText}</small>
        </div>
      </div>

      <div className='past-night-moods' aria-label='สัดส่วน mood คืนที่ผ่านมา'>
        {summary.moodCounts.map((mood) => (
          <div className='past-night-mood-row' key={mood.id}>
            <small>{mood.label}</small>
            <div>
              <i
                style={{
                  '--archive-color': mood.color,
                  '--archive-width': `${summary.count > 0 ? Math.max(8, (mood.count / strongestCount) * 100) : 0}%`,
                }}
              />
            </div>
            <em>{mood.count}</em>
          </div>
        ))}
      </div>

      {summary.sampleMessages.length > 0 && (
        <div className='past-night-samples'>
          <span>เสียงที่เหลือจากเมื่อคืน</span>
          {summary.sampleMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </section>
  );
}

export default PastNightSummary;
