import { useState } from 'react';
import useRetroStore from '../store/retroStore';
import Note from './Note';

export default function Group({ group, editable = false }) {
  const { socket, getNotesInGroup } = useRetroStore();
  const [title, setTitle] = useState(group.title);
  const [isEditing, setIsEditing] = useState(false);
  const notes = getNotesInGroup(group.id);

  const handleTitleSave = () => {
    if (title !== group.title) {
      socket?.emit('group:update', { groupId: group.id, title });
    }
    setIsEditing(false);
  };

  const columnClass = {
    start: 'border-l-4 border-success',
    stop: 'border-l-4 border-danger',
    continue: 'border-l-4 border-primary'
  }[group.column];

  return (
    <div className={`card ${columnClass}`}>
      {editable && isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
          className="input mb-3 font-semibold"
          placeholder="Group title..."
          autoFocus
        />
      ) : (
        <div
          className="mb-3 cursor-pointer"
          onClick={() => editable && setIsEditing(true)}
        >
          {title ? (
            <h4 className="font-semibold">{title}</h4>
          ) : (
            <p className="text-slate-400 text-sm italic">
              {editable ? 'Click to add title...' : 'Untitled group'}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {notes.map(note => (
          <Note key={note.id} note={note} revealed showAuthor />
        ))}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {notes.length} {notes.length === 1 ? 'note' : 'notes'}
      </div>
    </div>
  );
}
