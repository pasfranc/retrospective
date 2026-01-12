export default function Note({ note, revealed = false, showAuthor = false, className = '' }) {
  const columnClass = {
    start: 'note-start',
    stop: 'note-stop',
    continue: 'note-continue'
  }[note.column];

  return (
    <div className={`note-card ${columnClass} ${className}`}>
      {revealed || showAuthor ? (
        <>
          <p className="text-sm mb-2">{note.text}</p>
          <div className="text-xs text-slate-500">
            by {note.author_email.split('@')[0]}
          </div>
        </>
      ) : (
        <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
      )}
    </div>
  );
}
