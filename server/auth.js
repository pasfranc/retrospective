import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = '7d'; // Magic links valid for 7 days

/**
 * Generate a magic link token for a participant
 */
export function generateMagicToken(sessionId, email, role) {
  const payload = {
    sessionId,
    email,
    role, // 'facilitator' or 'participant'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

/**
 * Verify and decode a magic link token
 */
export function verifyMagicToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Generate magic links for all participants
 */
export function generateMagicLinks(sessionId, participants, clientUrl) {
  return participants.map(p => ({
    email: p.email,
    role: p.role,
    token: generateMagicToken(sessionId, p.email, p.role),
    link: `${clientUrl}/retro/${sessionId}?token=${generateMagicToken(sessionId, p.email, p.role)}`
  }));
}

/**
 * Middleware to verify JWT from request
 */
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const result = verifyMagicToken(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = result.data;
  next();
}

/**
 * Check if user is facilitator
 */
export function requireFacilitator(req, res, next) {
  if (req.user.role !== 'facilitator') {
    return res.status(403).json({ error: 'Facilitator access required' });
  }
  next();
}
