import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import useRetroStore from './store/retroStore';

import Landing from './pages/Landing';
import Setup from './pages/Setup';
import WaitingRoom from './pages/WaitingRoom';
import Brainstorm from './pages/Brainstorm';
import Grouping from './pages/Grouping';
import Voting from './pages/Voting';
import ActionItems from './pages/ActionItems';

function RetroSession() {
  const { sessionId } = useParams();
  const { token, user } = useAuth();
  const { currentPhase, connected } = useRetroStore();

  // Initialize socket connection
  useSocket(token, sessionId);

  // Show loading state while connecting
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Connecting to session...</p>
        </div>
      </div>
    );
  }

  // Route to correct phase
  switch (currentPhase) {
    case 'waiting':
      return <WaitingRoom />;
    case 'brainstorm':
      return <Brainstorm />;
    case 'grouping':
      return <Grouping />;
    case 'voting':
      return <Voting />;
    case 'actions':
      return <ActionItems />;
    default:
      return <WaitingRoom />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/retro/:sessionId" element={<RetroSession />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
