import { Router } from 'express';
import { getAllBonusCalculations, getBonusHistory, finalizeBonus, getHalfYearBonusHistory } from '../controllers/bonusController';

const router = Router();

router.get('/calculations', getAllBonusCalculations);
router.post('/finalize', finalizeBonus);
router.get('/half-year-history', getHalfYearBonusHistory);
router.get('/history', getBonusHistory);

export default router;
