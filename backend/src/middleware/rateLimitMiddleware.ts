import rateLimit from 'express-rate-limit';

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests from this IP. Please try again later.'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many authentication attempts from this IP. Please try again later.'
});
