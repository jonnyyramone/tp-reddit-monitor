import { reddit } from '@devvit/web/server';
import { SUBREDDITS } from './config';
import { scoreThread, type Thread } from './score';

export async function scanAllSubreddits(): Promise<Thread[]> {
  const threads: Thread[] = [];

  for (const sub of SUBREDDITS) {
    try {
      const listing = await reddit.getNewPosts({
        subredditName: sub,
        limit: 25,
      });
      for await (const post of listing) {
        const opportunity = scoreThread({
          title: post.title ?? '',
          selftext: post.body ?? '',
          numComments: post.numberOfComments ?? 0,
          createdUtc: post.createdAt
            ? Math.floor(post.createdAt.getTime() / 1000)
            : 0,
        });
        if (opportunity.total === 0) continue;
        threads.push({
          id: post.id ?? '',
          subreddit: sub,
          title: post.title ?? '',
          selftext: post.body ?? '',
          permalink: post.permalink ?? '',
          author: post.authorName ?? '[deleted]',
          numComments: post.numberOfComments ?? 0,
          createdUtc: post.createdAt
            ? Math.floor(post.createdAt.getTime() / 1000)
            : 0,
          opportunity,
        });
      }
    } catch (err) {
      console.error(`[scan] ${sub} failed:`, err);
    }
  }

  threads.sort((a, b) => b.opportunity.total - a.opportunity.total);
  return threads;
}