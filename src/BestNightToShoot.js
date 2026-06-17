import React, { useMemo } from 'react';
import { getMoonPhase } from './moonPhase';
import './BestNightToShoot.css';

const FORECAST_DAYS = 7;
const DAY_MS = 1000 * 60 * 60 * 24;

function formatForecastDate(date, index) {
  if (index === 0) {
    return 'คืนนี้';
  }

  if (index === 1) {
    return 'พรุ่งนี้';
  }

  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function getShootNote(bestNight) {
  if (bestNight.phase.illumination >= 97) {
    return 'ช่วงนี้พระจันทร์เกือบเต็ม เหมาะกับการถ่าย close-up และเก็บ texture ของผิวดวงจันทร์';
  }

  if (bestNight.phase.illumination >= 85) {
    return 'อีกไม่กี่คืนพระจันทร์จะสว่างมาก เหมาะกับการวางแผนออกไปถ่ายล่วงหน้า';
  }

  if (bestNight.phase.illumination >= 65) {
    return 'ช่วงนี้แสงกำลังค่อยๆ ดีขึ้น ลองถ่ายคู่กับตึก สายไฟ หรือเงาเมืองจะได้ mood สวย';
  }

  return 'ยังไม่ใช่ช่วงเต็มดวง แต่เหมาะกับภาพ mood เงียบๆ หรือพระจันทร์ดวงเล็กในฉากกว้าง';
}

function getForecast(referenceDate) {
  const nights = Array.from({ length: FORECAST_DAYS }, (_, index) => {
    const date = new Date(referenceDate.getTime() + index * DAY_MS);
    date.setHours(21, 0, 0, 0);
    const phase = getMoonPhase(date);

    return {
      date,
      dateLabel: formatForecastDate(date, index),
      dayOffset: index,
      phase,
    };
  });

  const bestNight = [...nights].sort((first, second) => second.phase.illumination - first.phase.illumination)[0];

  return {
    bestNight,
    nights,
    note: getShootNote(bestNight),
  };
}

function BestNightToShoot({ now }) {
  const forecast = useMemo(() => getForecast(now), [now]);

  return (
    <section className='best-night-card' aria-label='Best night to shoot the moon'>
      <div className='best-night-heading'>
        <span>shooting forecast</span>
        <strong>คืนที่น่าออกไปถ่าย</strong>
        <p>
          {forecast.bestNight.dayOffset === 0
            ? 'คืนนี้เป็นคืนที่สว่างที่สุดในช่วง 7 วันข้างหน้า'
            : `อีก ${forecast.bestNight.dayOffset} คืน พระจันทร์จะสว่างที่สุดในช่วง 7 วันข้างหน้า`}
        </p>
      </div>

      <div className='best-night-highlight'>
        <div
          className='best-night-moon'
          style={{ '--shoot-illumination': `${forecast.bestNight.phase.illumination}%` }}
          aria-hidden='true'
        />
        <div>
          <span>{forecast.bestNight.dateLabel}</span>
          <strong>{forecast.bestNight.phase.illumination}%</strong>
          <small>{forecast.bestNight.phase.thaiName}</small>
        </div>
      </div>

      <p className='best-night-note'>{forecast.note}</p>

      <div className='shooting-forecast-strip'>
        {forecast.nights.map((night) => (
          <div className={night.dayOffset === forecast.bestNight.dayOffset ? 'shooting-day best' : 'shooting-day'} key={night.date.toISOString()}>
            <span>{night.dateLabel}</span>
            <i style={{ '--shoot-illumination': `${night.phase.illumination}%` }} aria-hidden='true' />
            <strong>{night.phase.illumination}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BestNightToShoot;
