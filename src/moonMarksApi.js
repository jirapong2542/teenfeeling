import { isSupabaseConfigured, supabase } from './supabaseClient';

const TABLE_NAME = 'moon_marks';

export function getTonightStartIso(referenceDate = new Date()) {
  const start = new Date(referenceDate);

  if (start.getHours() < 6) {
    start.setDate(start.getDate() - 1);
  }

  start.setHours(18, 0, 0, 0);
  return start.toISOString();
}

export function getPreviousNightRange(referenceDate = new Date()) {
  const end = new Date(referenceDate);
  end.setHours(6, 0, 0, 0);

  if (referenceDate < end) {
    end.setDate(end.getDate() - 1);
  }

  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);

  return {
    end,
    endIso: end.toISOString(),
    start,
    startIso: start.toISOString(),
  };
}

export function getNightRangeFromSavedDate(savedDate = new Date()) {
  const date = new Date(savedDate);
  const start = new Date(date);
  const end = new Date(date);

  if (date.getHours() < 6) {
    start.setDate(start.getDate() - 1);
    start.setHours(18, 0, 0, 0);
    end.setHours(6, 0, 0, 0);
  } else {
    start.setHours(6, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);
  }

  return {
    end,
    endIso: end.toISOString(),
    start,
    startIso: start.toISOString(),
  };
}

function toMark(row, moods) {
  const mood = moods.find((item) => item.id === row.mood_id) || moods[0];

  return {
    id: row.id,
    x: row.x,
    y: row.y,
    mood,
    message: row.message,
    time: row.display_time,
    createdAt: row.created_at,
  };
}

function createNightSummary(rows, moods, range) {
  const moodCounts = moods.map((mood) => ({
    ...mood,
    count: rows.filter((row) => row.mood_id === mood.id).length,
  }));
  const dominantMood = [...moodCounts].sort((first, second) => second.count - first.count)[0];
  const sampleMessages = rows
    .slice(0, 3)
    .map((row) => row.message)
    .filter(Boolean);

  return {
    count: rows.length,
    dominantMood: dominantMood && dominantMood.count > 0 ? dominantMood : null,
    moodCounts,
    phaseDate: new Date(range.start.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    sampleMessages,
    startIso: range.startIso,
    endIso: range.endIso,
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
    .gte('created_at', getTonightStartIso())
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

export async function fetchTonightMoonCount() {
  if (!isSupabaseConfigured) {
    return {
      count: null,
      error: 'Supabase ยังไม่ได้ตั้งค่า env',
    };
  }

  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', getTonightStartIso());

  if (error) {
    return {
      count: null,
      error: error.message,
    };
  }

  return {
    count: count || 0,
    error: '',
  };
}

export async function fetchPreviousNightSummary(moods) {
  const fallbackRange = getPreviousNightRange();

  if (!isSupabaseConfigured) {
    return {
      error: 'Supabase ยังไม่ได้ตั้งค่า env',
      summary: createNightSummary([], moods, fallbackRange),
    };
  }

  const { data: latestRows, error: latestError } = await supabase
    .from(TABLE_NAME)
    .select('created_at')
    .lt('created_at', fallbackRange.endIso)
    .order('created_at', { ascending: false })
    .limit(1);

  if (latestError) {
    return {
      error: latestError.message,
      summary: createNightSummary([], moods, fallbackRange),
    };
  }

  const latestSavedDate = latestRows?.[0]?.created_at;
  const range = latestSavedDate ? getNightRangeFromSavedDate(new Date(latestSavedDate)) : fallbackRange;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('message,mood_id,created_at')
    .gte('created_at', range.startIso)
    .lt('created_at', range.endIso)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return {
      error: error.message,
      summary: createNightSummary([], moods, range),
    };
  }

  return {
    error: '',
    summary: createNightSummary(data || [], moods, range),
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
