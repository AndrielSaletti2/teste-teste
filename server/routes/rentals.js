import express from 'express';
import {
  getRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental
} from '../controllers/rentalController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRental } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRentals);
router.get('/:id', getRental);
router.post('/', validateRental, createRental);
router.put('/:id', updateRental);
router.delete('/:id', deleteRental);

export default router;