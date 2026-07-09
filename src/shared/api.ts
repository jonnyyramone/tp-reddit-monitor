export type QueueThread = {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  permalink: string;
  author: string;
  numComments: number;
  createdUtc: number;
  opportunity: {
    total: number;
    isDirect: boolean;
    isCompetitor: boolean;
    isCategory: boolean;
    isQuestion: boolean;
    matchedKeywords: string[];
  };
};

export type QueueResponse = {
  type: 'queue';
  postId: string;
  fromCache: boolean;
  threads: QueueThread[];
};