import { Crown } from 'lucide-react';

export default function Roster({ participants }) {
  const joined = participants.filter(p => p.status === 'joined');
  const pending = participants.filter(p => p.status === 'pending');

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Participants ({joined.length}/{participants.length})</h3>

      <div className="space-y-2">
        {joined.map(p => (
          <div key={p.email} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-medium">{p.email.split('@')[0]}</span>
              {p.role === 'facilitator' && (
                <Crown className="w-4 h-4 text-warning" />
              )}
            </div>
            <span className="text-xs text-success">Joined</span>
          </div>
        ))}

        {pending.map(p => (
          <div key={p.email} className="flex items-center gap-2 p-2 bg-slate-50 rounded opacity-50">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-medium">{p.email.split('@')[0]}</span>
              {p.role === 'facilitator' && (
                <Crown className="w-4 h-4 text-warning" />
              )}
            </div>
            <span className="text-xs text-slate-400">Pending</span>
          </div>
        ))}
      </div>
    </div>
  );
}
