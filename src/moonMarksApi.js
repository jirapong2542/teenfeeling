import { isSupabaseConfigured, supabase } from './supabaseClient';

const TABLE_NAME = 'moon_marks';

function toMark(row, moods) {
  const mood = moods.find((item) => item.id === row.mood_id) || moods[0];

  return {
    id: row.id,
    x: row.x,
    y: row.y,
    mood,
    message: row.message,
    time: row.display_time,
  };
}

function toRow(mark) {
  return {
    message: mark.message,
    mood_id: mark.mood.id,
    x: mark.x,
    y: mark.y,
    display_time: mark.time,
  };
}

export async function fetchMoonMarks(moods) {
  if (!isSupabaseConfigured) {
    return {
      marks: null,
      error: 'Supabase ยังไม่ได้ตั้งค่า env',
    };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id,message,mood_id,x,y,display_time,created_at')
    .order('created_at', { ascending: false })
    .limit(36);

  if (error) {
    return {
      marks: null,
      error: error.message,
    };
  }

  return {
    marks: data.map((row) => toMark(row, moods)),
    error: '',
  };
}

export async function createMoonMark(mark, moods) {
  if (!isSupabaseConfigured) {
    return {
      mark,
      error: 'Supabase ยังไม่ได้ตั้งค่า env',
    };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(toRow(mark))
    .select('id,message,mood_id,x,y,display_time,created_at')
    .single();

  if (error) {
    return {
      mark,
      error: error.message,
    };
  }

  return {
    mark: toMark(data, moods),
    error: '',
  };
}
