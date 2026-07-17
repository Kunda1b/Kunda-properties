import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { register, login, logout, refreshToken, verifyEmail, forgotPassword, resetPassword, getMe } from "../controllers/auth.controller";

const router = Router();
const authLimiter    = rateLimit({ windowMs: 15*60*1000, max: 10, message: { success: false, error: "Too many attempts, try again in 15 minutes" } });
const generalLimiter  = rateLimit({ windowMs: 60*1000, max: 30 });

const registerValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("firstName").trim().isLength({ min: 1, max: 50 }),
  body("lastName").trim().isLength({ min: 1, max: 50 }),
  body("role").optional().isIn(["BUYER","SELLER","AGENT"]),
];
const loginValidation = [ body("email").isEmail().normalizeEmail(), body("password").notEmpty() ];

router.post("/register", authLimiter, validate(registerValidation), register);
router.post("/login",    authLimiter, validate(loginValidation), login);
router.post("/refresh",  generalLimiter, refreshToken);
router.post("/forgot-password", authLimiter, validate([body("email").isEmail().normalizeEmail()]), forgotPassword);
router.post("/reset-password",  authLimiter, validate([body("token").notEmpty(), body("password").isLength({ min: 8 })]), resetPassword);
router.get("/verify-email/:token", verifyEmail);

router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

export default router;
