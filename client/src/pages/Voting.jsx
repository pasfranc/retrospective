import PhaseIndicator from '../components/PhaseIndicator';
import Group from '../components/Group';
import Note from '../components/Note';
import VoteButton from '../components/VoteButton';
import FacilitatorControls from '../components/FacilitatorControls';
import useRetroStore from '../store/retroStore';

export default function Voting() {
  const {
    notes,
    groups,
    participants,
    isFacilitator,
    currentPhase,
    getUserVoteCount,
    getVoteCount,
    session
  } = useRetroStore();

  const columns = ['start', 'stop', 'continue'];

  const votesRemaining = (session?.votes_per_person || 0) - getUserVoteCount();

  // Create votable items (groups and ungrouped notes) with vote counts
  const getVotableItems = (column) => {
    const items = [];

    // Add groups
    const columnGroups = groups.filter(g => g.column === column);
    columnGroups.forEach(group => {
      items.push({
        type: 'group',
        id: group.id,
        data: group,
        votes: getVoteCount(group.id)
      });
    });

    // Add ungrouped notes
    const ungroupedNotes = notes.filter(n => n.column === column && !n.group_id);
    ungroupedNotes.forEach(note => {
      items.push({
        type: 'note',
        id: note.id,
        data: note,
        votes: getVoteCount(note.id)
      });
    });

    // Sort by votes (descending)
    return items.sort((a, b) => b.votes - a.votes);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto py-8">
        <PhaseIndicator currentPhase={currentPhase} />

        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Voting</h1>
          <p className="text-slate-600">
            Vote on the most important items. You have {votesRemaining} vote{votesRemaining !== 1 ? 's' : ''} remaining.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-3 gap-6">
              {columns.map(column => {
                const items = getVotableItems(column);

                return (
                  <div key={column}>
                    <h3 className="text-xl font-bold mb-4 capitalize">{column}</h3>

                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="relative">
                          {item.type === 'group' ? (
                            <Group group={item.data} editable={false} />
                          ) : (
                            <Note note={item.data} revealed showAuthor />
                          )}

                          <div className="absolute -top-2 -right-2">
                            <VoteButton
                              targetId={item.id}
                              targetType={item.type}
                            />
                          </div>
                        </div>
                      ))}

                      {items.length === 0 && (
                        <div className="card bg-slate-50 text-center py-8 text-slate-400 text-sm">
                          No items to vote on
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {isFacilitator() && (
              <FacilitatorControls phase="voting" canProgress />
            )}

            <div className="card bg-blue-50 border-primary">
              <h4 className="font-semibold mb-2">Your Votes</h4>
              <div className="text-3xl font-bold text-primary">
                {votesRemaining} / {session?.votes_per_person || 0}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Click items to vote. Click again to remove your vote.
              </p>
            </div>

            <div className="card bg-slate-50">
              <h4 className="font-semibold mb-2 text-sm">Top Voted Items</h4>
              <div className="space-y-2">
                {[...groups, ...notes.filter(n => !n.group_id)]
                  .map(item => ({
                    id: item.id,
                    title: item.title || item.text?.substring(0, 30) + '...',
                    votes: getVoteCount(item.id)
                  }))
                  .filter(item => item.votes > 0)
                  .sort((a, b) => b.votes - a.votes)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <span className="text-xs flex-1 truncate">{item.title}</span>
                      <span className="text-xs font-bold">{item.votes}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
