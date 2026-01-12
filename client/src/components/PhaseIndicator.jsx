export default function PhaseIndicator({ currentPhase }) {
  const phases = [
    { id: 'waiting', label: 'Waiting' },
    { id: 'brainstorm', label: 'Brainstorm' },
    { id: 'grouping', label: 'Grouping' },
    { id: 'voting', label: 'Voting' },
    { id: 'actions', label: 'Actions' }
  ];

  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentIndex
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs mt-1 text-center">{phase.label}</span>
            </div>
            {index < phases.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${
                  index < currentIndex ? 'bg-primary' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
