import { ThumbsUp } from 'lucide-react';
import useRetroStore from '../store/retroStore';

export default function VoteButton({ targetId, targetType }) {
  const { socket, hasUserVoted, getVoteCount, getUserVoteCount, session } = useRetroStore();

  const voted = hasUserVoted(targetId);
  const voteCount = getVoteCount(targetId);
  const userVotes = getUserVoteCount();
  const canVote = userVotes < (session?.votes_per_person || 0);

  const handleVote = () => {
    if (voted) {
      socket?.emit('vote:remove', { targetId });
    } else if (canVote) {
      socket?.emit('vote:cast', { targetId, targetType });
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!voted && !canVote}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        voted
          ? 'bg-primary text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <ThumbsUp className="w-4 h-4" />
      <span className="font-medium">{voteCount}</span>
    </button>
  );
}
