import { ChevronRight, Eye, Download } from 'lucide-react';
import useRetroStore from '../store/retroStore';

export default function FacilitatorControls({ phase, onReveal, canProgress = true }) {
  const { socket, session } = useRetroStore();

  const nextPhaseMap = {
    waiting: 'brainstorm',
    brainstorm: 'grouping',
    grouping: 'voting',
    voting: 'actions',
    actions: 'complete'
  };

  const handleNextPhase = () => {
    const nextPhase = nextPhaseMap[phase];
    if (nextPhase && nextPhase !== 'complete') {
      socket?.emit('phase:change', { phase: nextPhase });
    }
  };

  const handleExport = async () => {
    try {
      const token = useRetroStore.getState().token;
      const response = await fetch(`/api/session/${session.id}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retro-${session.id}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export session');
    }
  };

  return (
    <div className="card bg-blue-50 border-primary">
      <h3 className="text-sm font-semibold mb-3 text-primary">Facilitator Controls</h3>

      <div className="flex gap-2">
        {phase === 'brainstorm' && onReveal && (
          <button onClick={onReveal} className="btn-primary flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Reveal All Notes
          </button>
        )}

        {phase !== 'actions' ? (
          <button
            onClick={handleNextPhase}
            disabled={!canProgress}
            className="btn-primary flex items-center gap-2"
          >
            Next Phase
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export & Finish
          </button>
        )}
      </div>
    </div>
  );
}
