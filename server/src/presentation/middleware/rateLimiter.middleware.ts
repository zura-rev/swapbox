import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'ძალიან ბევრი მოთხოვნა. გთხოვთ მოიცადოთ.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'ძალიან ბევრი მცდელობა. გთხოვთ 15 წუთი მოიცადოთ.' },
  skipSuccessfulRequests: true,
});

export const offerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'ძალიან ბევრი შეთავაზება. გთხოვთ მოიცადოთ.' },
});
