import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// SSL Certificate configuration for HTTPS
// For development, we'll use self-signed certificates
const sslOptions = {
  key: process.env.SSL_KEY_PATH ? fs.readFileSync(process.env.SSL_KEY_PATH) : undefined,
  cert: process.env.SSL_CERT_PATH ? fs.readFileSync(process.env.SSL_CERT_PATH) : undefined
};

const app = express();
const PORT = process.env.PORT || 19132;

// Configure trusted proxy for accurate IP detection
// Set this to 'true' if behind a proxy like nginx
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : false);

// JWT Secret - 在生产环境中应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'hkgd-secret-key-2024';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hkgdadmin2024';

console.log('=== SERVER CONFIGURATION ===');
console.log('Admin password loaded from .env:', ADMIN_PASSWORD);
console.log('Password length:', ADMIN_PASSWORD.length);
console.log('============================');

// IP封禁管理
const bannedIPs = new Map(); // IP -> { attempts, bannedUntil }
const MAX_LOGIN_ATTEMPTS = 5;
const BAN_DURATION = 15 * 60 * 1000; // 15分钟

// Session-based tracking for fallback (for inconsistent IP detection)
const sessionAttempts = new Map(); // sessionId -> { attempts, timestamp }

function getClientIP(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip']?.trim() ||
           req.socket.remoteAddress ||
           '127.0.0.1';

  // Normalize IPv6 localhost to IPv4 for consistency
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // Normalize IPv6 local addresses
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Use localhost as fallback for unknown IPs
  if (!ip || ip === 'unknown' || ip === '') {
    ip = '127.0.0.1';
  }

  return ip;
}

function isIPBanned(ip) {
  const banInfo = bannedIPs.get(ip);
  if (!banInfo) return false;
  
  if (banInfo.bannedUntil > Date.now()) {
    return true;
  } else {
    bannedIPs.delete(ip);
    return false;
  }
}

function recordFailedLogin(ip, sessionId = null) {
  // Try IP-based tracking first
  const existing = bannedIPs.get(ip);
  const banInfo = existing ? { ...existing } : { attempts: 0, bannedUntil: 0 };
  banInfo.attempts++;

  if (banInfo.attempts >= MAX_LOGIN_ATTEMPTS) {
    banInfo.bannedUntil = Date.now() + BAN_DURATION;
  }

  bannedIPs.set(ip, banInfo);

  // Also track by session ID as fallback for inconsistent IP detection
  // For localhost, use IP as session key since localhost requests should all come from same IP
  const isLocalhost = ip === '127.0.0.1' || ip === 'localhost';
  const sessionKey = (sessionId && !isLocalhost) ? sessionId : `ip_${ip}`;

  const sessionInfo = sessionAttempts.get(sessionKey) || { attempts: 0, timestamp: Date.now() };
  sessionInfo.attempts++;
  sessionInfo.timestamp = Date.now();
  sessionAttempts.set(sessionKey, sessionInfo);

  console.log(`Recorded failed login for ${isLocalhost ? 'localhost' : 'remote IP'}. Session key: ${sessionKey}. Attempts: ${sessionInfo.attempts}`);

  return banInfo;
}

function resetFailedAttempts(ip) {
  bannedIPs.delete(ip);
}

// Clean up old session attempts every hour
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  for (const [sessionId, data] of sessionAttempts.entries()) {
    if (data.timestamp < oneHourAgo) {
      sessionAttempts.delete(sessionId);
    }
  }
  console.log('Cleaned up old session attempts. Active sessions:', sessionAttempts.size);
}, 60 * 60 * 1000); // Every hour

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://*.discordapp.net"],
      connectSrc: ["'self'", "https://api.aredl.net", "https://pemonlist.com"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'https://hkgdl.ddns.net'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());

// Rate limiting for submission endpoint
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs (submission endpoint)
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs (increased from 5)
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting only to pending-submissions endpoint
app.use('/api/pending-submissions', apiLimiter);

// Serve static files from the dist directory (production build)
app.use(express.static(join(__dirname, 'dist')));

// IP封禁检查中间件
const checkIPBan = (req, res, next) => {
  const ip = getClientIP(req);
  
  if (isIPBanned(ip)) {
    const banInfo = bannedIPs.get(ip);
    const remainingTime = Math.ceil((banInfo.bannedUntil - Date.now()) / 1000);
    
    return res.status(403).json({
      error: 'IP banned',
      message: `Too many failed login attempts. Try again in ${Math.floor(remainingTime / 60)} minutes ${remainingTime % 60} seconds.`,
      remainingTime
    });
  }
  
  next();
};

// JWT 认证中间件 - reads from httpOnly cookie
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.hkgd_admin_token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation middleware helper
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Initialize SQLite database
const db = new Database(join(__dirname, 'hkgd.db'));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS levels (
    id TEXT PRIMARY KEY,
    hkgd_rank INTEGER,
    aredl_rank INTEGER,
    pemonlist_rank INTEGER,
    name TEXT NOT NULL,
    creator TEXT NOT NULL,
    verifier TEXT NOT NULL,
    level_id TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    song_id TEXT,
    song_name TEXT,
    tags TEXT,
    date_added TEXT,
    pack TEXT,
    gddl_tier INTEGER,
    nlw_tier TEXT
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level_id TEXT NOT NULL,
    player TEXT NOT NULL,
    date TEXT NOT NULL,
    video_url TEXT,
    fps TEXT,
    cbf INTEGER DEFAULT 0,
    attempts INTEGER,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS changelog (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    level_name TEXT NOT NULL,
    level_id TEXT NOT NULL,
    change_type TEXT NOT NULL,
    old_rank INTEGER,
    new_rank INTEGER,
    description TEXT NOT NULL,
    list_type TEXT DEFAULT 'classic'
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    country TEXT,
    levels_beaten INTEGER NOT NULL DEFAULT 0,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS pending_submissions (
    id TEXT PRIMARY KEY,
    level_id TEXT NOT NULL,
    level_name TEXT,
    is_new_level INTEGER DEFAULT 0,
    record_data TEXT NOT NULL,
    level_data TEXT,
    submitted_at TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  );
`);

// API Routes

// 认证端点
app.post('/api/auth/login',
  authLimiter,
  checkIPBan,
  body('password').notEmpty().trim().isLength({ min: 1, max: 128 }),
  validateRequest,
  (req, res) => {
  try {
    const { password } = req.body;
    const ip = getClientIP(req);

    // For localhost, use IP as session key for more reliable tracking
    const isLocalhost = ip === '127.0.0.1' || ip === 'localhost';
    const sessionId = req.cookies?.hkgd_session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionKey = isLocalhost ? `ip_${ip}` : sessionId;

    console.log('=== LOGIN ATTEMPT DEBUG ===');
    console.log('Raw headers:', {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'socket.remoteAddress': req.socket.remoteAddress
    });
    console.log('Detected IP:', ip);
    console.log('Is localhost:', isLocalhost);
    console.log('Session ID from cookie:', req.cookies?.hkgd_session_id);
    console.log('Generated Session ID:', sessionId);
    console.log('Session key for tracking:', sessionKey);
    console.log('All cookies:', req.cookies);
    console.log('Current bannedIPs state:', Array.from(bannedIPs.entries()));
    console.log('Current sessionAttempts state:', Array.from(sessionAttempts.entries()));
    console.log('=== PASSWORD COMPARISON ===');
    console.log('Submitted password:', `"${password}"`);
    console.log('Expected password:', `"${ADMIN_PASSWORD}"`);
    console.log('Passwords match:', password === ADMIN_PASSWORD);
    console.log('Password lengths:', password.length, 'vs', ADMIN_PASSWORD.length);
    console.log('===========================');

    if (password === ADMIN_PASSWORD) {
      // 登录成功，重置失败的尝试
      resetFailedAttempts(ip);
      sessionAttempts.delete(sessionKey); // Clear session attempts on success

      // 生成 JWT token with 2 hour expiry
      const token = jwt.sign(
        { isAdmin: true, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Set token in httpOnly, secure, sameSite cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('hkgd_admin_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        path: '/',
      });

      // Set session ID cookie
      res.cookie('hkgd_session_id', sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      res.json({
        success: true,
        user: { isAdmin: true }
      });
    } else {
      // 记录失败的登录尝试
      const banInfo = recordFailedLogin(ip, sessionId);

      // Always use session-based attempts if available (more reliable for localhost)
      const sessionInfo = sessionAttempts.get(sessionKey);
      const effectiveAttempts = sessionInfo ? sessionInfo.attempts : banInfo.attempts;

      console.log('=== FAILED LOGIN DEBUG ===');
      console.log('banInfo:', banInfo);
      console.log('sessionInfo:', sessionInfo);
      console.log('Session key:', sessionKey);
      console.log('Effective attempts:', effectiveAttempts);
      console.log('Attempts remaining:', MAX_LOGIN_ATTEMPTS - effectiveAttempts);
      console.log('===========================');

      // Set session ID cookie on failed login too
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('hkgd_session_id', sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      res.status(401).json({
        success: false,
        error: 'Invalid password',
        attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - effectiveAttempts),
        attempts: effectiveAttempts
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 验证 token 端点
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Logout endpoint - clears the authentication cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('hkgd_admin_token', {
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get all levels
app.get('/api/levels', (req, res) => {
  try {
    const levels = db.prepare(`
      SELECT
        id, hkgd_rank as hkgdRank, aredl_rank as aredlRank, pemonlist_rank as pemonlistRank, name, creator, verifier, level_id as levelId,
        description, thumbnail, song_id as songId, song_name as songName,
        tags, date_added as dateAdded, pack, gddl_tier as gddlTier, nlw_tier as nlwTier
      FROM levels
      ORDER BY hkgd_rank ASC
    `).all();

    // Get records for each level
    const levelsWithRecords = levels.map(level => {
      const records = db.prepare(`
        SELECT player, date, video_url as videoUrl, fps, cbf, attempts
        FROM records
        WHERE level_id = ?
        ORDER BY date DESC
      `).all(level.id).map(record => ({
        ...record,
        cbf: record.cbf === 1
      })); // Use id (internal ID) to match records table

      // Parse tags from JSON string
      const tags = level.tags ? JSON.parse(level.tags) : [];

      // Fix undefined songName
      const songName = level.songName && level.songName !== 'undefined by undefined' ? level.songName : null;

      return {
        ...level,
        songName,
        tags,
        records
      };
    });

    res.json(levelsWithRecords);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// Get a single level by ID
app.get('/api/levels/:id', (req, res) => {
  try {
    const level = db.prepare(`
      SELECT
        id, hkgd_rank as hkgdRank, aredl_rank as aredlRank, pemonlist_rank as pemonlistRank, name, creator, verifier, level_id as levelId,
        description, thumbnail, song_id as songId, song_name as songName,
        tags, date_added as dateAdded, pack, gddl_tier as gddlTier, nlw_tier as nlwTier
      FROM levels
      WHERE id = ?
    `).get(req.params.id);

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const records = db.prepare(`
            SELECT player, date, video_url as videoUrl, fps, cbf, attempts
            FROM records
            WHERE level_id = ?
            ORDER BY date DESC
          `).all(level.id).map(record => ({
            ...record,
            cbf: record.cbf === 1
          })); // Use id (internal ID) to match records table
    
        // Parse tags from JSON string
        const tags = level.tags ? JSON.parse(level.tags) : [];
    
        res.json({
          ...level,
          tags,
          records
        });  } catch (error) {
    console.error('Error fetching level:', error);
    res.status(500).json({ error: 'Failed to fetch level' });
  }
});

// Create a new level
app.post('/api/levels',
  authenticateToken,
  body('id').notEmpty().trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_]+$/),
  body('hkgdRank').optional().isInt({ min: 1 }),
  body('aredlRank').optional().isInt({ min: 1 }),
  body('pemonlistRank').optional().isInt({ min: 1 }),
  body('name').notEmpty().trim().isLength({ min: 1, max: 100 }).escape(),
  body('creator').notEmpty().trim().isLength({ min: 1, max: 50 }).escape(),
  body('verifier').notEmpty().trim().isLength({ min: 1, max: 50 }).escape(),
  body('levelId').notEmpty().trim().isLength({ min: 1, max: 20 }),
  body('description').optional().trim().isLength({ max: 1000 }).escape(),
  body('thumbnail').optional().isURL(),
  body('songId').optional().trim().isLength({ max: 20 }),
  body('songName').optional().trim().isLength({ max: 100 }),
  body('tags').optional().isArray(),
  body('dateAdded').optional().isISO8601(),
  body('pack').optional().trim().isLength({ max: 50 }),
  body('gddlTier').optional().isInt({ min: 1 }),
  body('nlwTier').optional().trim().isLength({ max: 20 }),
  validateRequest,
  (req, res) => {
  try {
    const {
      id, hkgdRank, aredlRank, pemonlistRank, name, creator, verifier, levelId, description,
      thumbnail, songId, songName, tags, dateAdded, pack,
      gddlTier, nlwTier
    } = req.body;

    console.log('Creating level:', { id, name, levelId, hkgdRank });

    const result = db.prepare(`
      INSERT INTO levels (
        id, hkgd_rank, aredl_rank, pemonlist_rank, name, creator, verifier, level_id,
        description, thumbnail, song_id, song_name, tags,
        date_added, pack, gddl_tier, nlw_tier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, hkgdRank, aredlRank, pemonlistRank, name, creator, verifier, levelId,
      description, thumbnail, songId, songName,
      JSON.stringify(tags), dateAdded, pack, gddlTier, nlwTier
    );

    console.log('Level created successfully');
    res.status(201).json({ id, message: 'Level created successfully' });
  } catch (error) {
    console.error('Error creating level:', error);
    res.status(500).json({ error: 'Failed to create level' });
  }
});

// Update a level
app.put('/api/levels/:id',
  authenticateToken,
  param('id').notEmpty().trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_]+$/),
  body('hkgdRank').optional().isInt({ min: 1 }),
  body('aredlRank').optional().isInt({ min: 1 }),
  body('pemonlistRank').optional().isInt({ min: 1 }),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).escape(),
  body('creator').optional().trim().isLength({ min: 1, max: 50 }).escape(),
  body('verifier').optional().trim().isLength({ min: 1, max: 50 }).escape(),
  body('levelId').optional().trim().isLength({ min: 1, max: 20 }),
  body('description').optional().trim().isLength({ max: 1000 }).escape(),
  body('thumbnail').optional().isURL(),
  body('songId').optional().trim().isLength({ max: 20 }),
  body('songName').optional().trim().isLength({ max: 100 }),
  body('tags').optional().isArray(),
  body('dateAdded').optional().isISO8601(),
  body('pack').optional().trim().isLength({ max: 50 }),
  body('gddlTier').optional().isInt({ min: 1 }),
  body('nlwTier').optional().trim().isLength({ max: 20 }),
  validateRequest,
  (req, res) => {
  try {
    const {
      hkgdRank, aredlRank, pemonlistRank, name, creator, verifier, levelId, description,
      thumbnail, songId, songName, tags, dateAdded, pack,
      gddlTier, nlwTier
    } = req.body;

    db.prepare(`
      UPDATE levels SET
        hkgd_rank = ?, aredl_rank = ?, pemonlist_rank = ?, name = ?, creator = ?, verifier = ?, level_id = ?,
        description = ?, thumbnail = ?, song_id = ?, song_name = ?,
        tags = ?, date_added = ?, pack = ?, gddl_tier = ?, nlw_tier = ?
      WHERE id = ?
    `).run(
      hkgdRank, aredlRank, pemonlistRank, name, creator, verifier, levelId,
      description, thumbnail, songId, songName,
      JSON.stringify(tags), dateAdded, pack, gddlTier, nlwTier,
      req.params.id
    );

    res.json({ message: 'Level updated successfully' });
  } catch (error) {
    console.error('Error updating level:', error);
    res.status(500).json({ error: 'Failed to update level' });
  }
});

// Delete a level
app.delete('/api/levels/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM levels WHERE id = ?').run(req.params.id);
    res.json({ message: 'Level deleted successfully' });
  } catch (error) {
    console.error('Error deleting level:', error);
    res.status(500).json({ error: 'Failed to delete level' });
  }
});

// Add a record to a level
app.post('/api/levels/:levelId/records',
  authenticateToken,
  param('levelId').notEmpty().trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_]+$/),
  body('player').notEmpty().trim().isLength({ min: 1, max: 50 }).escape(),
  body('date').notEmpty().isISO8601(),
  body('videoUrl').optional().isURL().isLength({ max: 500 }),
  body('fps').optional().trim().isLength({ max: 20 }),
  body('cbf').optional().isBoolean(),
  body('attempts').optional().isInt({ min: 0 }),
  validateRequest,
  (req, res) => {
  try {
    const { player, date, videoUrl, fps, cbf, attempts } = req.body;

    console.log('Adding record to level:', req.params.levelId);
    console.log('Record data:', { player, date, videoUrl, fps, cbf, attempts });

    // Validate videoUrl
    const validVideoUrl = videoUrl && videoUrl.length > 10 ? videoUrl : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    const result = db.prepare(`
      INSERT INTO records (level_id, player, date, video_url, fps, cbf, attempts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.levelId, player, date, validVideoUrl, fps, cbf ? 1 : 0, attempts);

    console.log('Record added successfully, ID:', result.lastInsertRowid);
    res.status(201).json({ message: 'Record added successfully', id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: 'Failed to add record' });
  }
});

// Get all members
app.get('/api/members', (req, res) => {
  try {
    const members = db.prepare(`
      SELECT id, name, country, levels_beaten as levelsBeaten, avatar
      FROM members
      ORDER BY levels_beaten DESC
    `).all();

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get changelog
app.get('/api/changelog', (req, res) => {
  try {
    const changelog = db.prepare(`
      SELECT 
        id, date, level_name as levelName, level_id as levelId,
        change_type as change, old_rank as oldRank, new_rank as newRank, description, list_type as listType
      FROM changelog
      ORDER BY date DESC
    `).all();

    res.json(changelog);
  } catch (error) {
    console.error('Error fetching changelog:', error);
    res.status(500).json({ error: 'Failed to fetch changelog' });
  }
});

// Add changelog entry
app.post('/api/changelog',
  authenticateToken,
  body('id').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('date').notEmpty().isISO8601(),
  body('levelName').notEmpty().trim().isLength({ min: 1, max: 100 }).escape(),
  body('levelId').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('change').notEmpty().trim().isIn(['added', 'removed', 'moved_up', 'moved_down', 'updated']),
  body('oldRank').optional().isInt({ min: 1 }),
  body('newRank').optional().isInt({ min: 1 }),
  body('description').notEmpty().trim().isLength({ min: 1, max: 500 }).escape(),
  body('listType').optional().trim().isIn(['classic', 'platformer']),
  validateRequest,
  (req, res) => {
  try {
    const { id, date, levelName, levelId, change, oldRank, newRank, description, listType } = req.body;

    db.prepare(`
      INSERT INTO changelog (id, date, level_name, level_id, change_type, old_rank, new_rank, description, list_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, date, levelName, levelId, change, oldRank, newRank, description, listType || 'classic');

    res.status(201).json({ id, message: 'Changelog entry created successfully' });
  } catch (error) {
    console.error('Error creating changelog entry:', error);
    res.status(500).json({ error: 'Failed to create changelog entry' });
  }
});

// Delete individual changelog entry
app.delete('/api/changelog/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM changelog WHERE id = ?').run(req.params.id);
    res.json({ message: 'Changelog entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting changelog entry:', error);
    res.status(500).json({ error: 'Failed to delete changelog entry' });
  }
});

// Clear all changelog entries
app.delete('/api/changelog', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM changelog').run();
    res.json({ message: 'Changelog cleared successfully' });
  } catch (error) {
    console.error('Error clearing changelog:', error);
    res.status(500).json({ error: 'Failed to clear changelog' });
  }
});

// Get website content
app.get('/api/content', (req, res) => {
  try {
    const contentRow = db.prepare("SELECT content_json FROM website_content WHERE id = 'main'").get();
    
    if (contentRow) {
      res.json(JSON.parse(contentRow.content_json));
    } else {
      // Return default content if not in database
      const defaultContent = {
        hero: {
          title: "HKGD DEMON LIST",
          subtitle: "Hong Kong Geometry Dash Community",
          description: "Welcome to the official HKGD Demon List! We track and rank the hardest Extreme Demon levels beaten by members of the Hong Kong Geometry Dash community.",
          ctaButton: "View Demon List"
        },
        stats: {
          levelsLabel: "Levels Listed",
          playersLabel: "Players",
          hardestLabel: "Hardest AREDL"
        },
        listPage: {
          title: "Demon List",
          description: "All Extreme Demon levels beaten by HKGD members, ranked by difficulty.",
          searchPlaceholder: "Search levels..."
        },
        platformerPage: {
          title: "Platformer Demon List",
          description: "Platformer Extreme Demon levels beaten by HKGD members.",
          emptyMessage: "The platformer demon list is currently empty. Be the first HKGD member to beat a platformer extreme demon!"
        },
        submitPage: {
          title: "Submit Record",
          description: "Add your completion to the list",
          cbfInfo: "Click Between Frames (CBF) is a mod that allows players to click between rendered frames, potentially improving performance on high-refresh-rate monitors. Records using CBF are marked with a CBF tag."
        },
        footer: {
          description: "The official demon list for the Hong Kong Geometry Dash community. Tracking the hardest Extreme Demon levels beaten by our members.",
          credits: "Made with love by HKGD Community • Made By lh201202729 and yorklui"
        }
      };
      res.json(defaultContent);
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Save website content
app.post('/api/content', authenticateToken, (req, res) => {
  try {
    const content = req.body;
    const content_json = JSON.stringify(content);
    const updated_at = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO website_content (id, content_json, updated_at)
      VALUES ('main', ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        content_json = excluded.content_json,
        updated_at = excluded.updated_at
    `).run(content_json, updated_at);
    
    res.json({ message: 'Content saved successfully' });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Proxy endpoint for Platformer Demons API (bypasses CORS)
app.get('/api/platformer-demons', async (req, res) => {
  try {
    console.log('Fetching platformer demons from Pemonlist API...');
    
    // Fetch all 465 platformer demons with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://pemonlist.com/api/list?limit=465', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pemonlist API error ${response.status}: ${errorText}`);
      throw new Error(`Pemonlist API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 'unknown'} platformer demons`);
    res.json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Timeout fetching platformer demons (10 seconds)');
      return res.status(504).json({ error: 'Request timeout: Pemonlist API is not responding' });
    }
    console.error('Error fetching platformer demons:', error);
    res.status(500).json({ 
      error: 'Failed to fetch platformer demons',
      details: error.message 
    });
  }
});

// Get pending submissions
app.get('/api/pending-submissions', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT 
        id, level_id as levelId, level_name as levelName, is_new_level as isNewLevel,
        record_data as record, level_data as levelData, submitted_at as submittedAt,
        submitted_by as submittedBy, status
      FROM pending_submissions
      WHERE status = 'pending'
      ORDER BY submitted_at DESC
    `).all();

    // Parse JSON strings
    const parsedSubmissions = submissions.map(sub => ({
      ...sub,
      record: JSON.parse(sub.record),
      levelData: sub.levelData ? JSON.parse(sub.levelData) : undefined
    }));

    res.json(parsedSubmissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
});

// Create a pending submission (no auth required - regular users can submit)
app.post('/api/pending-submissions',
  body('id').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('levelId').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('levelName').optional().trim().isLength({ max: 100 }).escape(),
  body('isNewLevel').optional().isBoolean(),
  body('record').notEmpty(),
  body('levelData').optional(),
  body('submittedAt').notEmpty().isISO8601(),
  body('submittedBy').notEmpty().trim().isLength({ min: 1, max: 50 }).escape(),
  body('status').optional().trim().isIn(['pending', 'approved', 'rejected']),
  validateRequest,
  (req, res) => {
  try {
    const {
      id, levelId, levelName, isNewLevel, record, levelData,
      submittedAt, submittedBy, status
    } = req.body;

    // Check if level already exists in database
    const existingLevel = db.prepare('SELECT id FROM levels WHERE id = ?').get(levelId);
    
    // If level exists, force isNewLevel to false to prevent duplicate creation
    const finalIsNewLevel = existingLevel ? false : (isNewLevel || false);

    // Check if a pending submission for this level and player already exists
    const existingSubmission = db.prepare(`
      SELECT id FROM pending_submissions 
      WHERE level_id = ? AND JSON_EXTRACT(record_data, '$.player') = ? AND status = 'pending'
    `).get(levelId, record.player);

    if (existingSubmission) {
      console.log(`Duplicate submission prevented for level ${levelId} by player ${record.player}`);
      return res.status(400).json({ 
        error: 'A pending submission for this level by the same player already exists' 
      });
    }

    db.prepare(`
      INSERT INTO pending_submissions (
        id, level_id, level_name, is_new_level, record_data, level_data,
        submitted_at, submitted_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, levelId, levelName, finalIsNewLevel ? 1 : 0,
      JSON.stringify(record), levelData ? JSON.stringify(levelData) : null,
      submittedAt, submittedBy, status || 'pending'
    );

    console.log(`Submission created: level ${levelId} (isNewLevel: ${finalIsNewLevel}, already exists: ${!!existingLevel})`);
    res.status(201).json({ id, message: 'Submission created successfully' });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Approve or reject a submission
app.put('/api/pending-submissions/:id',
  authenticateToken,
  param('id').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('status').notEmpty().trim().isIn(['approved', 'rejected']),
  validateRequest,
  (req, res) => {
  try {
    const { status } = req.body;

    console.log('Updating submission status:', req.params.id, 'to', status);

    const result = db.prepare(`
      UPDATE pending_submissions SET status = ? WHERE id = ?
    `).run(status, req.params.id);

    if (result.changes === 0) {
      console.log('No submission found with id:', req.params.id);
      return res.status(404).json({ error: 'Submission not found' });
    }

    console.log('Submission status updated successfully');
    res.json({ message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// AREDL Sync endpoint - syncs rankings and adjusts positions
app.post('/api/aredl-sync', authenticateToken, async (req, res) => {
  try {
    console.log('Starting AREDL sync...');
    
    // Fetch latest AREDL levels
    const aredlResponse = await fetch('https://api.aredl.net/v2/api/aredl/levels', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!aredlResponse.ok) {
      throw new Error(`AREDL API returned ${aredlResponse.status}`);
    }
    
    const aredlLevels = await aredlResponse.json();
    console.log(`Fetched ${aredlLevels.length} levels from AREDL`);
    
    // Create a map of AREDL levels by level_id for quick lookup
    const aredlMap = new Map();
    aredlLevels.forEach(level => {
      aredlMap.set(level.level_id, level);
    });
    
    // Get current levels from database
    const currentLevels = db.prepare(`
      SELECT id, hkgd_rank, aredl_rank, name, creator, verifier, description, level_id
      FROM levels
      ORDER BY hkgd_rank ASC
    `).all();
    
    console.log(`Current levels in database: ${currentLevels.length}`);
    
    // Track changes for changelog
    const rankChanges = [];
    const addedLevels = [];
    const updatedLevels = [];
    
    // Update existing levels and track new levels
    const currentLevelIds = new Set(currentLevels.map(l => l.level_id));
    
    currentLevels.forEach(level => {
      const aredlLevel = aredlMap.get(level.level_id);
      
      if (aredlLevel) {
        const oldAredlRank = level.aredl_rank;
        const newAredlRank = aredlLevel.position;
        
        // Update AREDL rank if changed
        if (oldAredlRank !== newAredlRank) {
          db.prepare('UPDATE levels SET aredl_rank = ? WHERE id = ?')
            .run(newAredlRank, level.id);
          
          rankChanges.push({
            id: level.id,
            name: level.name,
            oldAredlRank,
            newAredlRank
          });
          
          console.log(`Updated ${level.name}: AREDL rank ${oldAredlRank} → ${newAredlRank}`);
        }
        
        // Update level data if changed
        const dataChanged = 
          level.name !== aredlLevel.name ||
          level.creator !== aredlLevel.creator ||
          level.verifier !== aredlLevel.verifier ||
          level.description !== aredlLevel.description;
        
        if (dataChanged) {
          db.prepare(`
            UPDATE levels SET 
              name = ?, 
              creator = ?, 
              verifier = ?, 
              description = ?
            WHERE id = ?
          `).run(
            aredlLevel.name,
            aredlLevel.creator,
            aredlLevel.verifier,
            aredlLevel.description || '',
            level.id
          );
          
          updatedLevels.push({
            id: level.id,
            name: aredlLevel.name,
            oldName: level.name
          });
          
          console.log(`Updated data for ${level.name}`);
        }
      }
    });
    
    // Re-sort levels by AREDL rank and update HKGD ranks
    const levelsToSort = db.prepare(`
      SELECT id, aredl_rank, name
      FROM levels
      WHERE aredl_rank IS NOT NULL
      ORDER BY aredl_rank ASC
    `).all();
    
    console.log(`Sorting ${levelsToSort.length} levels by AREDL rank`);
    
    // Update HKGD ranks based on AREDL order
    const rankUpdates = [];
    levelsToSort.forEach((level, index) => {
      const newHkgdRank = index + 1;
      const oldHkgdRank = level.hkgd_rank;
      
      if (oldHkgdRank !== newHkgdRank) {
        rankUpdates.push({
          id: level.id,
          name: level.name,
          oldRank: oldHkgdRank,
          newRank: newHkgdRank,
          direction: newHkgdRank < oldHkgdRank ? 'moved_up' : 'moved_down'
        });
      }
      
      db.prepare('UPDATE levels SET hkgd_rank = ? WHERE id = ?')
        .run(newHkgdRank, level.id);
    });
    
    // Create changelog entries only for newly added levels
    const timestamp = Date.now();
    
    // Add new levels to changelog with above/below format
    addedLevels.forEach(level => {
      const changelogId = `added-${level.id}-${timestamp}`;
      
      // Find levels above and below the new position
      let aboveLevel = null;
      let belowLevel = null;
      
      if (level.rank > 1) {
        aboveLevel = levelsToSort[level.rank - 2]; // -1 for 0-index, -1 for above
      }
      
      if (level.rank <= levelsToSort.length) {
        belowLevel = levelsToSort[level.rank - 1]; // -1 for 0-index
      }
      
      // Build description with adjacent levels
      let description = `${level.name} has been placed at #${level.rank}`;
      if (aboveLevel) {
        description += `, above ${aboveLevel.name}`;
      }
      if (belowLevel) {
        description += ` and below ${belowLevel.name}`;
      }
      
      db.prepare(`
        INSERT INTO changelog (id, date, level_name, level_id, change_type, new_rank, description, list_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        changelogId,
        new Date().toISOString(),
        level.name,
        level.id,
        'added',
        level.rank,
        description,
        'classic'
      );
    });
    
    console.log(`Created ${addedLevels.length} changelog entries for new levels`);
    
    res.json({
      success: true,
      message: `AREDL sync completed. Added ${addedLevels.length} new levels, updated ${updatedLevels.length} levels, and moved ${rankUpdates.length} levels.`,
      stats: {
        added: addedLevels.length,
        updated: updatedLevels.length,
        rankChanges: rankUpdates.length,
        totalLevels: levelsToSort.length
      },
      changes: {
        added: addedLevels,
        updated: updatedLevels,
        moved: rankUpdates
      }
    });
    
  } catch (error) {
    console.error('AREDL sync error:', error);
    res.status(500).json({
      error: 'AREDL sync failed'
    });
  }
});

// Serve frontend for all non-API routes (must be last)
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Start server
if (sslOptions.key && sslOptions.cert) {
  // HTTPS server with provided certificates
  const httpsServer = https.createServer(sslOptions, app);
  const HTTPS_PORT = process.env.HTTPS_PORT || 19133;
  
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`HKGD API server running on https://0.0.0.0:${HTTPS_PORT}`);
  });
} else {
  // HTTP server (development mode or no certificates)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HKGD API server running on http://0.0.0.0:${PORT}`);
    console.log('WARNING: Running in HTTP mode. For production, enable HTTPS with SSL certificates.');
  });
}