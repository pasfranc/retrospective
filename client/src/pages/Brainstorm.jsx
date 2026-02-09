import { useState } from 'react';
import { Plus } from 'lucide-react';
import PhaseIndicator from '../components/PhaseIndicator';
import Roster from '../components/Roster';
import Note from '../components/Note';
import FacilitatorControls from '../components/FacilitatorControls';
import useRetroStore from '../store/retroStore';

export default function Brainstorm() {
  const { socket, notes, participants, isFacilitator, currentPhase, user } = useRetroStore();
  const [revealed, setRevealed] = useState(false);
  const [newNotes, setNewNotes] = useState({ start: '', stop: '', continue: '' });

  const columns = [
    { id: 'start', title: 'Start', color: 'success', description: 'Things we should start doing' },
    { id: 'stop', title: 'Stop', color: 'danger', description: 'Things we should stop doing' },
    { id: 'continue', title: 'Continue', color: 'primary', description: 'Things working well' }
  ];

  const handleAddNote = (column) => {
    const text = newNotes[column].trim();
    if (!text) return;

    socket?.emit('note:add', { column, text });
    setNewNotes({ ...newNotes, [column]: '' });
  };

  const handleEditNote = (noteId, text) => {
    socket?.emit('note:edit', { noteId, text });
  };

  const handleDeleteNote = (noteId) => {
    socket?.emit('note:delete', { noteId });
  };

  const handleReveal = () => {
    setRevealed(true);
  };

  const getColumnNotes = (column) => notes.filter(n => n.column === column);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto py-8">
        <PhaseIndicator currentPhase={currentPhase} />

        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Brainstorming</h1>
          <p className="text-slate-600">
            {revealed
              ? 'All notes are now visible. Review and discuss before moving to grouping.'
              : 'Write your thoughts in each column. Notes are hidden until the facilitator reveals them.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-3 gap-6">
              {columns.map(column => (
                <div key={column.id}>
                  <div className="card bg-white border-2 border-slate-200 mb-4">
                    <h3 className={`text-xl font-bold text-${column.color} mb-1`}>
                      {column.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{column.description}</p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNotes[column.id]}
                        onChange={(e) => setNewNotes({ ...newNotes, [column.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote(column.id)}
                        placeholder="Add a note..."
                        className="input text-sm flex-1"
                      />
                      <button
                        onClick={() => handleAddNote(column.id)}
                        className="btn-primary p-2"
                        disabled={!newNotes[column.id].trim()}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getColumnNotes(column.id).map(note => (
                      <Note key={note.id} note={note} revealed={revealed} currentUserEmail={user?.email} onEdit={handleEditNote} onDelete={handleDeleteNote} />
                    ))}

                    {getColumnNotes(column.id).length === 0 && (
                      <div className="card bg-slate-50 text-center py-8 text-slate-400 text-sm">
                        No notes yet
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Roster participants={participants} />

            {isFacilitator() && (
              <FacilitatorControls
                phase="brainstorm"
                onReveal={!revealed ? handleReveal : undefined}
                canProgress={revealed && notes.length > 0}
              />
            )}

            <div className="card bg-slate-50">
              <h4 className="font-semibold mb-2 text-sm">Notes Summary</h4>
              <div className="space-y-1 text-sm">
                {columns.map(col => (
                  <div key={col.id} className="flex justify-between">
                    <span>{col.title}:</span>
                    <span className="font-medium">{getColumnNotes(col.id).length}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{notes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
