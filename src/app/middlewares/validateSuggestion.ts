import { Request, Response, NextFunction } from 'express';

export const validateSuggestion = (req: Request, res: Response, next: NextFunction) => {
  const airport = req.params['airport'];

  if (!airport || airport.length < 3) {
    return res.status(400).json({
      error: 'Airport parameter must be at least 3 characters long'
    });
  }

  next();
};

