import { Request, Response, NextFunction } from 'express';
import { Airport } from '../../data';

export function validateAirportCode(airportsByCode: Map<string, Airport>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const code = req.params['code'];

    if (!code) {
      return res.status(400).send('Must provide airport code');
    }

    const airport = airportsByCode.get(code.toLowerCase());
    if (!airport) {
      return res.status(404).send('No such airport, please provide a valid IATA/ICAO code');
    }

    (req as any).airport = airport;
    next();
  };
}