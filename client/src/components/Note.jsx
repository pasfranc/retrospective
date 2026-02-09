export default function Note({ note, revealed = false, showAuthor = false, currentUserEmail = null, className = '' }) {
  const columnClass = {
    start: 'note-start',
    stop: 'note-stop',
    continue: 'note-continue'
  }[note.column];

  const isOwn = currentUserEmail && note.author_email === currentUserEmail;
  const visible = revealed || showAuthor || isOwn;

  return (
    <div className={`note-card ${columnClass} ${className}`}>
      {visible ? (
        <>
          <p className="text-sm mb-2">{note.text}</p>
          <div className="text-xs text-slate-500">
            {isOwn && !revealed ? 'You' : `by ${note.author_email.split('@')[0]}`}
          </div>
        </>
      ) : (
        <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
      )}
    </div>
  );
}
