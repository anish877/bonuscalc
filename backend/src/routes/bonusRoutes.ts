import { Router } from 'express';
import { getAllBonusCalculations, getBonusHistory } from '../controllers/bonusController';

const router = Router();

router.get('/calculations', getAllBonusCalculations);
router.get('/history', getBonusHistory);

export default router;
