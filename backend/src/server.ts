import express from 'express';
import { generalApiLimiter, authLimiter } from './middleware/rateLimitMiddleware';

const port = 3000;
const app = express();

// Render runs the app behind a proxy. Trust one proxy hop so rate limiting uses the real client IP.
app.set("trust proxy", 1);

app.use(generalApiLimiter); // Apply general API rate limiting to all routes

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
