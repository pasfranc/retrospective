import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Retro Tool</h1>
          <p className="text-lg text-slate-600">
            Run effective team retrospectives with Start/Stop/Continue framework
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/setup')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Create Retro</h2>
            </div>
            <p className="text-slate-600">
              Start a new retrospective session and invite your team
            </p>
          </div>

          <div className="card border-slate-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold">Join Retro</h2>
            </div>
            <p className="text-slate-600">
              Click your magic link from email to join a session
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="font-semibold mb-4">How it works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
            <div>
              <div className="font-semibold text-primary mb-2">1. Setup</div>
              <p>Facilitator invites team with email addresses</p>
            </div>
            <div>
              <div className="font-semibold text-primary mb-2">2. Collaborate</div>
              <p>Team writes, groups, and votes on notes</p>
            </div>
            <div>
              <div className="font-semibold text-primary mb-2">3. Act</div>
              <p>Create action items and export results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
