import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import {
  sessionQueries,
  participantQueries,
  noteQueries,
  groupQueries,
  voteQueries,
  actionQueries
} from './db.js';
import {
  generateMagicLinks,
  verifyMagicToken,
  authMiddleware,
  requireFacilitator
} from './auth.js';
import { setupSocketHandlers } from './socket-handlers.js';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create session (no auth required - initial setup)
app.post('/api/session/create', (req, res) => {
  try {
    const { emails, facilitatorEmail, votesPerPerson } = req.body;

    // Validation
    if (!emails || !Array.isArray(emails) || emails.length < 2) {
      return res.status(400).json({ error: 'At least 2 emails required' });
    }

    if (!facilitatorEmail || !emails.includes(facilitatorEmail)) {
      return res.status(400).json({ error: 'Facilitator must be in participant list' });
    }

    if (!votesPerPerson || votesPerPerson < 1) {
      return res.status(400).json({ error: 'Invalid votes per person' });
    }

    const sessionId = nanoid(10);
    const now = Date.now();

    // Create session
    sessionQueries.create.run(sessionId, facilitatorEmail, votesPerPerson, now, now);

    // Create participants
    const participants = emails.map(email => ({
      email,
      role: email === facilitatorEmail ? 'facilitator' : 'participant'
    }));

    participants.forEach(p => {
      participantQueries.create.run(sessionId, p.email, p.role);
    });

    // Generate magic links
    const magicLinks = generateMagicLinks(sessionId, participants, CLIENT_URL);

    res.json({
      sessionId,
      magicLinks
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Verify token
app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const result = verifyMagicToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    res.json({ valid: true, data: result.data });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Get session data (requires auth)
app.get('/api/session/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.user;

    // Verify user belongs to this session
    if (id !== sessionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const session = sessionQueries.getById.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const participants = participantQueries.getBySession.all(id);
    const notes = noteQueries.getBySession.all(id);
    const groups = groupQueries.getBySession.all(id);
    const votes = voteQueries.getBySession.all(id);
    const actions = actionQueries.getBySession.all(id);

    res.json({
      session,
      participants,
      notes,
      groups,
      votes,
      actions
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Export session data (facilitator only)
app.get('/api/session/:id/export', authMiddleware, requireFacilitator, (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.user;

    if (id !== sessionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const session = sessionQueries.getById.get(id);
    const participants = participantQueries.getBySession.all(id);
    const notes = noteQueries.getBySession.all(id);
    const groups = groupQueries.getBySession.all(id);
    const votes = voteQueries.getBySession.all(id);
    const actions = actionQueries.getBySession.all(id);

    // Calculate vote counts per target
    const voteCounts = {};
    votes.forEach(vote => {
      voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1;
    });

    const exportData = {
      sessionId: session.id,
      facilitator: session.facilitator_email,
      date: new Date(session.created_at).toISOString(),
      framework: 'Start/Stop/Continue',
      participants: participants.map(p => ({
        email: p.email,
        role: p.role,
        joined: p.status === 'joined'
      })),
      notes: notes.map(n => ({
        id: n.id,
        author: n.author_email,
        column: n.column,
        text: n.text,
        groupId: n.group_id
      })),
      groups: groups.map(g => ({
        id: g.id,
        title: g.title,
        column: g.column,
        noteIds: notes.filter(n => n.group_id === g.id).map(n => n.id),
        votes: voteCounts[g.id] || 0
      })),
      actionItems: actions.map(a => ({
        title: a.title,
        assignee: a.assignee,
        linkedTo: a.linked_to,
        createdAt: new Date(a.created_at).toISOString()
      }))
    };

    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export session' });
  }
});

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static('../client/dist'));

  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '../client/dist' });
  });
}

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Client URL: ${CLIENT_URL}`);
});
