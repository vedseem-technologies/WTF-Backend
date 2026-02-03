import express from 'express';
import { getMenuSelection, saveMenuSelection, deleteMenuSelection } from '../controllers/menuSelection.controller.js';

const router = express.Router();

// GET /api/menu-selection/:entityType/:entityId
router.get('/:entityType/:entityId', getMenuSelection);

// POST /api/menu-selection/:entityType/:entityId
router.post('/:entityType/:entityId', saveMenuSelection);

// PATCH /api/menu-selection/:entityType/:entityId (Alias to save/upsert)
router.patch('/:entityType/:entityId', saveMenuSelection);

// DELETE /api/menu-selection/:entityType/:entityId
router.delete('/:entityType/:entityId', deleteMenuSelection);

export default router;
