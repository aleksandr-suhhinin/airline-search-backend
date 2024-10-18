import * as express from 'express';
import * as cors from 'cors';
import { notNil, flatten } from '../util';
import { Airport, loadAirportData, buildGraphWithGroundTransfers } from '../data';
import { calculateRoute } from './services';
import { validateAirportCode, validateSourceAndDestination, validateSuggestion } from './middlewares';
import { suggestion } from './services/suggestion';


export async function createApp() {
  const app = express();

  const airports = await loadAirportData();
  await buildGraphWithGroundTransfers();
  const airportsByCode = new Map<string, Airport>(
    flatten(airports.map((airport) => [
      airport.iata !== null ? [airport.iata.toLowerCase(), airport] as const : null,
      airport.icao !== null ? [airport.icao.toLowerCase(), airport] as const : null,
    ].filter(notNil)))
  );

  app.use(cors());

  app.get('/health', (_, res) => res.send('OK'));
  app.get('/api/airports/:code', validateAirportCode(airportsByCode), (req, res) => {
    const airport = (req as any).airport;
    return res.status(200).send(airport);
  });

  app.get('/api/routes/:source/:destination', validateSourceAndDestination(airportsByCode), async (req, res) => {
    const source = req.params['source'];
    const destination = req.params['destination'];
    const withGroundTransfer = req.query['with-ground-hops'] !== undefined;

    const result = await calculateRoute(source, destination, airportsByCode, withGroundTransfer);
    return res.status(200).send(result);
  });

  app.get('/api/suggestions/:airport', validateSuggestion, async (req, res) => {
    const queryString = req.params['airport']
    const result = suggestion(queryString, airports);
    return res.status(200).send(result);
  });

  return app;
}


