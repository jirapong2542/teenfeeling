import React, { useEffect, useState } from 'react';

const SESSION_KEY = 'teenfeeling-development-notice-seen';

function DevelopmentNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true);
    }
  }, []);

  const closeNotice = () => {
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className='notice-layer' role='dialog' aria-modal='true' aria-labelledby='development-notice-title'>
      <div className='notice-card'>
        <p className='eyebrow'>development preview</p>
        <h2 id='development-notice-title'>เว็บนี้ยังอยู่ในขั้นตอนพัฒนา</h2>
        <p>
          ตอนนี้เป็นเวอร์ชันทดลองของ Leave a Light บางฟีเจอร์ เช่น การฝากแสงรวมทุกคน
          และการแชร์ลง Instagram อาจยังเปลี่ยนแปลงได้
        </p>
        <button className='notice-button' onClick={closeNotice} type='button'>
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
}

export default DevelopmentNotice;
