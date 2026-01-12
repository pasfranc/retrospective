import { useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import PhaseIndicator from '../components/PhaseIndicator';
import Group from '../components/Group';
import Note from '../components/Note';
import FacilitatorControls from '../components/FacilitatorControls';
import useRetroStore from '../store/retroStore';

export default function ActionItems() {
  const {
    socket,
    notes,
    groups,
    actions,
    participants,
    isFacilitator,
    currentPhase,
    getVoteCount
  } = useRetroStore();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [linkedTo, setLinkedTo] = useState('');

  // Get all votable items sorted by votes
  const topItems = [...groups, ...notes.filter(n => !n.group_id)]
    .map(item => ({
      id: item.id,
      title: item.title || item.text?.substring(0, 50),
      votes: getVoteCount(item.id),
      type: item.title !== undefined ? 'group' : 'note',
      data: item
    }))
    .sort((a, b) => b.votes - a.votes);

  const handleCreateAction = () => {
    if (!title.trim() || !assignee) return;

    socket?.emit('action:create', {
      title: title.trim(),
      assignee,
      linkedTo: linkedTo || null
    });

    setTitle('');
    setAssignee('');
    setLinkedTo('');
    setShowForm(false);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto py-8">
        <PhaseIndicator currentPhase={currentPhase} />

        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Action Items</h1>
          <p className="text-slate-600">
            Create action items based on the top-voted topics. Assign them to team members.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Action Items ({actions.length})</h2>
                {isFacilitator() && (
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                )}
              </div>

              {showForm && isFacilitator() && (
                <div className="card bg-blue-50 mb-4">
                  <h3 className="font-semibold mb-3">New Action Item</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input"
                        placeholder="What needs to be done?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Assignee</label>
                      <select
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        className="input"
                      >
                        <option value="">-- Select assignee --</option>
                        {participants.map(p => (
                          <option key={p.email} value={p.email}>
                            {p.email.split('@')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Link to Item (optional)
                      </label>
                      <select
                        value={linkedTo}
                        onChange={(e) => setLinkedTo(e.target.value)}
                        className="input"
                      >
                        <option value="">-- Not linked --</option>
                        {topItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.title} ({item.votes} votes)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateAction}
                        disabled={!title.trim() || !assignee}
                        className="btn-primary flex-1"
                      >
                        Create Action
                      </button>
                      <button onClick={() => setShowForm(false)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {actions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No action items yet</p>
                  {isFacilitator() && (
                    <p className="text-sm mt-2">Click "Add Action" to create the first one</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <div key={action.id} className="card bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{action.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>
                              Assignee: <strong>{action.assignee.split('@')[0]}</strong>
                            </span>
                            {action.linked_to && (
                              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">
                                Linked to voted item
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isFacilitator() && (
              <FacilitatorControls phase="actions" canProgress />
            )}

            <div className="card bg-slate-50">
              <h3 className="font-semibold mb-3">Top Voted Items</h3>
              <div className="space-y-3">
                {topItems.slice(0, 5).map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <span className="text-xs font-bold">{item.votes} votes</span>
                    </div>
                    {item.type === 'group' ? (
                      <Group group={item.data} editable={false} />
                    ) : (
                      <Note note={item.data} revealed showAuthor />
                    )}
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
