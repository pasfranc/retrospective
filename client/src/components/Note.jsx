import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export default function Note({ note, revealed = false, showAuthor = false, currentUserEmail = null, onEdit, onDelete, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const columnClass = {
    start: 'note-start',
    stop: 'note-stop',
    continue: 'note-continue'
  }[note.column];

  const isOwn = currentUserEmail && note.author_email === currentUserEmail;
  const visible = revealed || showAuthor || isOwn;

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== note.text) {
      onEdit?.(note.id, trimmed);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditText(note.text);
    setEditing(false);
  };

  return (
    <div className={`note-card ${columnClass} ${className}`}>
      {visible ? (
        <>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="input text-sm flex-1"
                autoFocus
              />
              <button onClick={handleSave} className="text-green-600 hover:text-green-800">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm mb-2 flex-1">{note.text}</p>
                {isOwn && onEdit && onDelete && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-slate-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(note.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {isOwn && !revealed ? 'You' : `by ${note.author_email.split('@')[0]}`}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
      )}
    </div>
  );
}
