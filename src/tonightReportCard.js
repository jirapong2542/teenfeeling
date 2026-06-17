import moonFull from './1.jpg';

const REPORT_WIDTH = 1080;
const REPORT_HEIGHT = 1920;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCenteredText(context, text, x, y, maxWidth) {
  context.textAlign = 'center';
  context.fillText(text, x, y, maxWidth);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawMetric(context, label, value, x, y, width) {
  context.save();
  context.fillStyle = 'rgba(244, 239, 229, 0.07)';
  context.strokeStyle = 'rgba(244, 239, 229, 0.14)';
  context.lineWidth = 1;
  roundedRect(context, x, y, width, 126, 18);
  context.fill();
  context.stroke();

  context.fillStyle = '#f4efe5';
  context.font = '700 38px Segoe UI, sans-serif';
  context.fillText(value, x + 28, y + 52, width - 56);

  context.fillStyle = '#a79f94';
  context.font = '24px Segoe UI, sans-serif';
  context.fillText(label, x + 28, y + 92, width - 56);
  context.restore();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/(\s+)/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const testLine = `${line}${word}`;

    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line.trim());
      line = word.trimStart();
      return;
    }

    line = testLine;
  });

  if (line.trim()) {
    lines.push(line.trim());
  }

  lines.slice(0, maxLines).forEach((item, index) => {
    context.fillText(item, x, y + index * lineHeight, maxWidth);
  });
}

function drawMoon(context, image, phase) {
  const size = 620;
  const x = (REPORT_WIDTH - size) / 2;
  const y = 260;
  const centerX = REPORT_WIDTH / 2;
  const centerY = y + size / 2;
  const cropSize = Math.min(image.width, image.height) * 0.66;
  const cropX = (image.width - cropSize) / 2;
  const cropY = (image.height - cropSize) / 2;
  const shadowShift = Math.round((phase.age / 29.530588853) * 100);

  const glow = context.createRadialGradient(centerX, centerY, size * 0.2, centerX, centerY, size * 0.72);
  glow.addColorStop(0, 'rgba(244, 239, 229, 0.23)');
  glow.addColorStop(0.45, 'rgba(159, 183, 216, 0.12)');
  glow.addColorStop(1, 'rgba(244, 239, 229, 0)');
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, size * 0.74, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(244, 239, 229, 0.13)';
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(centerX, centerY, 455, 190, -0.2, 0, Math.PI * 2);
  context.stroke();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, cropX, cropY, cropSize, cropSize, x, y, size, size);

  context.globalCompositeOperation = 'multiply';
  const shadow = context.createRadialGradient(
    x + (shadowShift / 100) * size,
    centerY,
    size * 0.1,
    x + (shadowShift / 100) * size,
    centerY,
    size * 0.7
  );
  shadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadow.addColorStop(0.48, 'rgba(1, 2, 4, 0.72)');
  shadow.addColorStop(1, 'rgba(1, 2, 4, 0.96)');
  context.fillStyle = shadow;
  context.fillRect(x, y, size, size);
  context.restore();
}

export async function createTonightReportBlob(report) {
  const canvas = document.createElement('canvas');
  canvas.width = REPORT_WIDTH;
  canvas.height = REPORT_HEIGHT;
  const context = canvas.getContext('2d');
  const image = await loadImage(moonFull);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const background = context.createLinearGradient(0, 0, 0, REPORT_HEIGHT);
  background.addColorStop(0, '#010204');
  background.addColorStop(0.48, '#07090f');
  background.addColorStop(1, '#020304');
  context.fillStyle = background;
  context.fillRect(0, 0, REPORT_WIDTH, REPORT_HEIGHT);

  for (let index = 0; index < 130; index += 1) {
    const x = (index * 197) % REPORT_WIDTH;
    const y = ((index * 313) % 1360) + 40;
    const alpha = 0.09 + ((index % 6) / 100);
    context.fillStyle = `rgba(244, 239, 229, ${alpha})`;
    context.fillRect(x, y, index % 8 === 0 ? 2 : 1, index % 8 === 0 ? 2 : 1);
  }

  context.fillStyle = '#f4efe5';
  context.font = '700 32px Segoe UI, sans-serif';
  context.fillText('TONIGHT MOON REPORT', 96, 118);

  context.textAlign = 'right';
  context.fillStyle = '#a79f94';
  context.font = '26px Segoe UI, sans-serif';
  context.fillText('@t__n_f__ling', REPORT_WIDTH - 96, 118);

  drawMoon(context, image, report.phase);

  context.textAlign = 'center';
  context.fillStyle = '#dac38b';
  context.font = '700 28px Segoe UI, sans-serif';
  drawCenteredText(context, report.phase.illuminationText, REPORT_WIDTH / 2, 970, 760);

  context.fillStyle = '#f4efe5';
  context.font = '800 72px Segoe UI, sans-serif';
  drawCenteredText(context, report.phase.thaiName, REPORT_WIDTH / 2, 1058, 850);

  context.fillStyle = '#9fb7d8';
  context.font = '30px Segoe UI, sans-serif';
  drawCenteredText(context, report.phase.name, REPORT_WIDTH / 2, 1110, 760);

  drawMetric(context, 'illumination', `${report.phase.illumination}%`, 96, 1190, 270);
  drawMetric(context, 'lights tonight', `${report.tonightCount}`, 405, 1190, 270);
  drawMetric(context, report.resetCountdown.reportLabel, report.resetCountdown.text.replace(' ชม. ', ':').replace(' นาที ', ':').replace(' วิ', ''), 714, 1190, 270);

  context.fillStyle = '#d7d0c2';
  context.font = '30px Segoe UI, sans-serif';
  context.textAlign = 'center';
  drawWrappedText(context, report.phase.tone, REPORT_WIDTH / 2, 1408, 760, 46, 2);

  context.fillStyle = '#a79f94';
  context.font = '26px Segoe UI, sans-serif';
  drawCenteredText(context, report.dominantMoodText, REPORT_WIDTH / 2, 1542, 760);

  context.strokeStyle = 'rgba(244, 239, 229, 0.16)';
  context.beginPath();
  context.moveTo(96, 1685);
  context.lineTo(REPORT_WIDTH - 96, 1685);
  context.stroke();

  context.textAlign = 'left';
  context.fillStyle = '#f4efe5';
  context.font = '30px Segoe UI, sans-serif';
  context.fillText('same moon, tonight report', 96, 1746);

  context.fillStyle = '#a79f94';
  context.font = '24px Segoe UI, sans-serif';
  context.fillText('share your moon at t__n_f__ling', 96, 1790);

  context.textAlign = 'right';
  context.fillText(report.timeText, REPORT_WIDTH - 96, 1746);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Cannot create report image'));
        return;
      }

      resolve(blob);
    }, 'image/png', 1);
  });
}
