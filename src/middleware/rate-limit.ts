import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitConfig {
  interval: number; 
  maxRequests: number;
}

const requests = new Map<string, number[]>();

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const ip = getIP(req);
    const now = Date.now();
    const windowStart = now - config.interval;

    const userRequests = requests.get(ip) || [];
    
    const recentRequests = userRequests.filter(time => time > windowStart);
  
    if (recentRequests.length >= config.maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((recentRequests[0] + config.interval - now) / 1000)
      });
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    if (Math.random() < 0.01) {
      cleanupOldEntries(config.interval);
    }
    
    next();
  };
}

function getIP(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function cleanupOldEntries(interval: number) {
  const now = Date.now();
  const windowStart = now - interval;
  
  for (const [ip, times] of requests.entries()) {
    const recent = times.filter(time => time > windowStart);
    if (recent.length === 0) {
      requests.delete(ip);
    } else {
      requests.set(ip, recent);
    }
  }
}

export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  config: RateLimitConfig = { interval: 60000, maxRequests: 60 } // 60 req/min default
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const limiter = rateLimit(config);
    
    return new Promise<void>((resolve, reject) => {
      limiter(req, res, async () => {
        try {
          await handler(req, res);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}