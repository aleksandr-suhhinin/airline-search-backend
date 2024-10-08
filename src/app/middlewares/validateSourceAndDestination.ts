import { Request, Response, NextFunction } from 'express';
import { Airport } from '../../data';

export function validateSourceAndDestination(airportsByCode: Map<string, Airport>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const source = req.params['source'];
    const destination = req.params['destination'];

    if (!source || !destination) {
      return res.status(400).send('Must provide source and destination airports');
    }

    const sourceAirport = airportsByCode.get(source.toLowerCase());
    const destinationAirport = airportsByCode.get(destination.toLowerCase());

    if (!sourceAirport || !destinationAirport) {
      return res.status(404).send('No such airport, please provide valid IATA/ICAO codes');
    }

    next();
  };
}