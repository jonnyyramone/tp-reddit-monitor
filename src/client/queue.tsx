import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo, showToast } from '@devvit/web/client';
import type { QueueResponse, QueueThread } from '../shared/api';

const BUCKET_HIGH = 6;
const BUCKET_MEDIUM = 3;

function bucket(score: number): 'high' | 'medium' | 'low' {
  if (score >= BUCKET_HIGH) return 'high';
  if (score >= BUCKET_MEDIUM) return 'medium';
  return 'low';
}

function bucketStyle(b: 'high' | 'medium' | 'low'): string {
  if (b === 'high') return 'bg-red-600 text-white';
  if (b === 'medium') return 'bg-amber-500 text-white';
  return 'bg-gray-300 text-gray-800';
}

function timeAgo(epochSeconds: number): string {
  const seconds = Math.floor(Date.now() / 1000 - epochSeconds);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ThreadRow({ thread }: { thread: QueueThread }) {
  const b = bucket(thread.opportunity.total);
  const tags: string[] = [];
  if (thread.opportunity.isDirect) tags.push('TP');
  if (thread.opportunity.isCompetitor) tags.push('Comp');
  if (thread.opportunity.isCategory) tags.push('Cat');
  if (thread.opportunity.isQuestion) tags.push('?');

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${bucketStyle(b)}`}>
          {b.toUpperCase()} {thread.opportunity.total}
        </span>
        <span className="text-xs text-gray-500">r/{thread.subreddit}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{thread.numComments} comments</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{timeAgo(thread.createdUtc)}</span>
        {tags.map((tag) => (
          <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 mb-1">{thread.title}</h3>
      {thread.selftext && (
        <p className="text-xs text-gray-600 line-clamp-3 mb-2">
          {thread.selftext.slice(0, 240)}
          {thread.selftext.length > 240 ? '...' : ''}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-gray-400">
          by u/{thread.author}
          {thread.opportunity.matchedKeywords.length > 0 && (
            <>
              {' · matched: '}
              {thread.opportunity.matchedKeywords.slice(0, 3).join(', ')}
            </>
          )}
        </div>
        <button
          onClick={() => {
            if (!thread.permalink) {
              showToast('Thread link unavailable');
              return;
            }
            navigateTo(`https://reddit.com${thread.permalink}`);
          }}
          className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800"
        >
          Open & reply
        </button>
      </div>
    </article>
  );
}
export function QueueApp() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async (refresh = false): Promise<void> => {
    if (refresh) setRefreshing(true);
    try {
      const path = refresh ? '/api/refresh' : '/api/queue';
      const res = await fetch(path, { method: refresh ? 'POST' : 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as QueueResponse | { status: string; message: string };
      if ('status' in json && json.status === 'error') throw new Error(json.message);
      setData(json as QueueResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchQueue(false);
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading queue...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
          Error: {error}
        </div>
        <button
          onClick={() => void fetchQueue(false)}
          className="mt-4 text-sm bg-blue-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const threads = data?.threads ?? [];
  const high = threads.filter((t) => t.opportunity.total >= BUCKET_HIGH);
  const medium = threads.filter(
    (t) => t.opportunity.total >= BUCKET_MEDIUM && t.opportunity.total < BUCKET_HIGH
  );
  const low = threads.filter((t) => t.opportunity.total < BUCKET_MEDIUM);

  return (
    <div className="min-h-full">
      <header className="bg-blue-900 text-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">TP Marketing Reply Queue</h1>
            <p className="text-xs opacity-80">
              {threads.length} relevant thread{threads.length === 1 ? '' : 's'}
              {data?.fromCache ? ' (cached)' : ''}
            </p>
          </div>
          <button
            onClick={() => void fetchQueue(true)}
            disabled={refreshing}
            className="text-xs bg-white text-blue-900 px-3 py-1.5 rounded font-semibold disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {threads.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center text-sm text-gray-500">
            No matching threads. Try a manual refresh.
          </div>
        ) : (
          <>
            <Section title="High priority" subtitle="Score >= 6">
              {high.length ? high.map((t) => <ThreadRow key={t.id} thread={t} />) : <Empty msg="Nothing high-priority." />}
            </Section>
            <Section title="Medium" subtitle="Score 3-5">
              {medium.length ? medium.map((t) => <ThreadRow key={t.id} thread={t} />) : <Empty msg="Nothing medium." />}
            </Section>
            <Section title="Low / background" subtitle="Score < 3">
              {low.length ? low.map((t) => <ThreadRow key={t.id} thread={t} />) : <Empty msg="Nothing in the bucket." />}
            </Section>
          </>
        )}
      </main>

      <footer className="px-4 py-4 text-[11px] text-gray-400 text-center">
        Faculty reply as themselves. Customer-service framing only.
      </footer>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: import('react').ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="bg-white border border-gray-200 rounded px-3 py-3 text-xs text-gray-500">{msg}</div>;
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<QueueApp />);
