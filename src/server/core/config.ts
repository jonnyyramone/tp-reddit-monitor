export const SUBREDDITS = [
  'singapore',
  'SGExams',
  'askSingapore',
  'PolyStudents',
  'NUS',
  'NTU',
] as const;

export const KEYWORDS = {
  direct: [
    'temasek polytechnic',
    'tp marketing',
    'tp dip marketing',
    'temasek poly',
  ],
  competitor: [
    'nus business',
    'ntu marketing',
    'sit marketing',
    'rmit marketing',
    'sim marketing',
  ],
  category: [
    'poly vs uni',
    'marketing diploma',
    'which poly',
    'polytechnic marketing',
    'diploma in marketing',
    'should i go poly',
  ],
} as const;

export const QUESTION_PATTERNS = [
  /\?$/m,
  /\bshould i\b/i,
  /\bwhich (poly|school|course|programme)\b/i,
  /\brecommend\b/i,
  /\bworth it\b/i,
  /\bthinking of\b/i,
];

export const CACHE_KEY = 'tp_monitor:threads';
export const CACHE_TTL_SECONDS = 60 * 60 * 24;