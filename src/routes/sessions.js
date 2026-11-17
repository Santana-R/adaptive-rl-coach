'use strict';

const express = require('express');
const { ApiError, CONTRACT_VERSION } = require('../middleware/auth');
const { parseId, parseCreate, parsePatch } = require('../domain/sessions');
const sessions = require('../repositories/sessions');

const META = { contract_version: CONTRACT_VERSION };

function notFound() {
  return new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
}

function sessionId(req) {
  const id = parseId(req.params.sessionId);
  if (id === null) throw notFound();
  return id;
}

function createSessionsRouter({ supabase, requireAuth, requireRole }) {
  const router = express.Router();

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(requireAuth, requireRole('player', 'admin'));

  router.get('/', async (req, res) => {
    const data = await sessions.listSessions(supabase, req.user.id);
    const training = {
      source: 'self_reported_sessions',
      session_count: data.length,
      duration_minutes: data.reduce((total, session) => total + (session.duration_minutes ?? 0), 0)
    };

    return res.json({ data, meta: { ...META, training } });
  });

  router.post('/', async (req, res) => {
    const session = parseCreate(req.body);
    const data = await sessions.createSession(supabase, req.user.id, session);

    return res.status(201).location('/api/v1/sessions/' + data.session_id).json({ data, meta: META });
  });

  router.get('/:sessionId', async (req, res) => {
    const [data] = await sessions.listSessions(supabase, req.user.id, sessionId(req));
    if (!data) throw notFound();

    return res.json({ data, meta: META });
  });

  router.patch('/:sessionId', async (req, res) => {
    const id = sessionId(req);
    const changes = parsePatch(req.body);
    const data = await sessions.updateSession(supabase, req.user.id, id, changes);

    return res.json({ data, meta: META });
  });

  router.delete('/:sessionId', async (req, res) => {
    const data = await sessions.deleteSession(supabase, req.user.id, sessionId(req));

    return res.json({ data, meta: META });
  });

  return router;
}

module.exports = { createSessionsRouter };