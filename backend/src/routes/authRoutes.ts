import express from 'express';
import { loginUser, logoutUser, getMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

export default router;
