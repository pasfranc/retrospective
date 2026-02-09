import { useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useRetroStore from '../store/retroStore';
import Note from './Note';

function DraggableGroupNote({ note }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Note note={note} revealed showAuthor />
    </div>
  );
}

export default function Group({ group, editable = false }) {
  const { socket, getNotesInGroup } = useRetroStore();
  const [title, setTitle] = useState(group.title);
  const [isEditing, setIsEditing] = useState(false);
  const notes = getNotesInGroup(group.id);

  // Make group droppable when editable
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.id}`,
    disabled: !editable
  });

  const handleTitleSave = () => {
    if (title !== group.title) {
      socket?.emit('group:update', { groupId: group.id, title });
    }
    setIsEditing(false);
  };

  // Check if group contains notes from multiple columns
  const noteColumns = [...new Set(notes.map(n => n.column))];
  const isMixed = noteColumns.length > 1 || group.column === 'mixed';

  // Use neutral border for mixed groups, colored for single-column groups
  const columnClass = isMixed
    ? 'border-l-4 border-slate-400'
    : {
        start: 'border-l-4 border-success',
        stop: 'border-l-4 border-danger',
        continue: 'border-l-4 border-primary'
      }[group.column] || 'border-l-4 border-slate-400';

  return (
    <div
      ref={setNodeRef}
      className={`card ${columnClass} transition-all ${isOver ? 'ring-2 ring-primary ring-opacity-50 bg-blue-50' : ''}`}
    >
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

      {editable ? (
        <SortableContext
          items={notes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {notes.map(note => (
              <DraggableGroupNote key={note.id} note={note} />
            ))}
          </div>
        </SortableContext>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <Note key={note.id} note={note} revealed showAuthor />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
        {isMixed && (
          <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-medium">
            Mixed: {noteColumns.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
