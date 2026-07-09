import { KEYWORDS, QUESTION_PATTERNS } from './config';

export type OpportunityScore = {
  total: number;
  isDirect: boolean;
  isCompetitor: boolean;
  isCategory: boolean;
  isQuestion: boolean;
  matchedKeywords: string[];
};

export type Thread = {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  permalink: string;
  author: string;
  numComments: number;
  createdUtc: number;
  opportunity: OpportunityScore;
};

export function scoreThread(input: {
  title: string;
  selftext: string;
  numComments: number;
  createdUtc: number;
}): OpportunityScore {
  const text = `${input.title} ${input.selftext}`.toLowerCase();
  const matched: string[] = [];

  const direct = KEYWORDS.direct.filter((k) => {
    const hit = text.includes(k);
    if (hit) matched.push(k);
    return hit;
  });
  const competitor = KEYWORDS.competitor.filter((k) => {
    const hit = text.includes(k);
    if (hit) matched.push(k);
    return hit;
  });
  const category = KEYWORDS.category.filter((k) => {
    const hit = text.includes(k);
    if (hit) matched.push(k);
    return hit;
  });

  const isQuestion = QUESTION_PATTERNS.some((re) =>
    re.test(`${input.title} ${input.selftext}`)
  );

  let total = 0;
  if (direct.length) total += 5 + (direct.length - 1) * 2;
  if (competitor.length) total += 3;
  if (category.length) total += 2;
  if (isQuestion) total += 2;
  if (input.numComments >= 1 && input.numComments <= 5) total += 1;
  if (Date.now() / 1000 - input.createdUtc < 60 * 60 * 24) total += 1;

  return {
    total,
    isDirect: direct.length > 0,
    isCompetitor: competitor.length > 0,
    isCategory: category.length > 0,
    isQuestion,
    matchedKeywords: matched,
  };
}

export function scoreBucket(score: number): 'high' | 'medium' | 'low' {
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}