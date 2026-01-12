import { Clock } from 'lucide-react';
import Roster from '../components/Roster';
import PhaseIndicator from '../components/PhaseIndicator';
import useRetroStore from '../store/retroStore';

export default function WaitingRoom() {
  const { socket, participants, isFacilitator } = useRetroStore();

  const joinedCount = participants.filter(p => p.status === 'joined').length;
  const canStart = joinedCount >= 2;

  const handleStart = () => {
    socket?.emit('phase:change', { phase: 'brainstorm' });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto py-8">
        <PhaseIndicator currentPhase="waiting" />

        <div className="mt-8 text-center mb-8">
          <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Waiting Room</h1>
          {isFacilitator() ? (
            <p className="text-slate-600">
              Waiting for participants to join. You can start when at least 2 people have joined.
            </p>
          ) : (
            <p className="text-slate-600">
              Waiting for the facilitator to start the retrospective...
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Roster participants={participants} />

          {isFacilitator() && (
            <div className="card bg-blue-50 border-primary">
              <h3 className="font-semibold mb-4">Ready to start?</h3>
              <p className="text-sm text-slate-600 mb-4">
                Make sure all participants have joined before starting the retrospective.
              </p>
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="btn-primary w-full"
              >
                {canStart ? 'Start Retrospective' : `Need ${2 - joinedCount} more participant(s)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
