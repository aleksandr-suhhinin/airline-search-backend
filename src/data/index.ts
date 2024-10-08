import * as parse from 'csv-parse';
import { readFile, readFileSync, writeFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

import { notNil, haversine } from '../util';

export const GROUND_LIMIT = 100;

export interface Airport {
  id: string;
  icao: string | null;
  iata: string | null;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  nearbyAirports?: Airport[];
}

export interface Route {
  source: Airport;
  destination: Airport;
  distance: number;
}

export let cachedGraph: Map<string, Route[]> | null = null;

function parseCSV<T extends Readonly<string[]>>(filePath: string, columns: T): Promise<{ [key in T[number]]: string }[]> {
  return new Promise((resolve, reject) => {
    readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }

      parse(data, { columns: Array.from(columns), skip_empty_lines: true, relax_column_count: true }, (err, rows) => {
        if (err) {
          return reject(err);
        }

        resolve(rows);
      });
    });
  });
}

export async function loadAirportData(): Promise<Airport[]> {
  const columns = ['airportID', 'name', 'city', 'country', 'iata', 'icao', 'latitude', 'longitude'] as const;
  const rows = await parseCSV(resolvePath(__dirname, './airports.dat'), columns);

  return rows.map((row) => ({
    id: row.airportID,
    icao: row.icao === '\\N' ? null : row.icao,
    iata: row.iata === '\\N' ? null : row.iata,
    name: row.name,
    location: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
  }));
}

export async function loadRouteData(): Promise<Route[]> {
  const airports = await loadAirportData();
  const airportsById = new Map<string, Airport>(airports.map((airport) => [airport.id, airport] as const));

  const columns = ['airline', 'airlineID', 'source', 'sourceID', 'destination', 'destinationID', 'codeshare', 'stops'] as const;
  const rows = await parseCSV(resolvePath(__dirname, './routes.dat'), columns);

  return rows.filter((row) => row.stops === '0').map((row) => {
    const source = airportsById.get(row.sourceID);
    const destination = airportsById.get(row.destinationID);

    if (source === undefined || destination === undefined) {
      return null;
    }

    return {
      source,
      destination,
      distance: haversine(
        source.location.latitude, source.location.longitude,
        destination.location.latitude, destination.location.longitude,
      ),
    }
  }).filter(notNil);
}

function loadCachedGraph(): Map<string, Route[]> | null{
  if (cachedGraph) return cachedGraph;
  try {
    const data = readFileSync('cached-graph.json', 'utf-8');
    const graphObject = JSON.parse(data);
    cachedGraph = new Map(Object.entries(graphObject));    
  } catch {
    return null;
  }
}


export async function buildGraphWithGroundTransfers(): Promise<Map<string, Route[]>> {

  cachedGraph = loadCachedGraph();

  if (cachedGraph) {
      return cachedGraph;
  }
  
  const routes = await loadRouteData();
  const airports = await loadAirportData();
  const graph: Map<string, Route[]> = new Map();

  for (const route of routes) {
      const sourceCode = route.source.iata;
      if (!sourceCode) continue;

      if (!graph.has(sourceCode)) {
          graph.set(sourceCode, []);
      }
      graph.get(sourceCode)!.push(route);
  }

  const airportList = Array.from(airports.values());

  // adding ground transfers between airports
  for (let i = 0; i < airportList.length; i++) {
      for (let j = i + 1; j < airportList.length; j++) {
          const airportA = airportList[i];
          const airportB = airportList[j];

          const groundDistance = haversine(
              airportA.location.latitude,
              airportA.location.longitude,
              airportB.location.latitude,
              airportB.location.longitude
          );

          if (groundDistance <= GROUND_LIMIT) {
              const routeAtoB: Route = {
                  source: airportA,
                  destination: airportB,
                  distance: groundDistance,
              };
              const routeBtoA: Route = {
                  source: airportB,
                  destination: airportA,
                  distance: groundDistance,
              };

              if (!graph.has(airportA.iata)) {
                  graph.set(airportA.iata, []);
              }
              if (!graph.has(airportB.iata)) {
                  graph.set(airportB.iata, []);
              }

              graph.get(airportA.iata)!.push(routeAtoB);
              graph.get(airportB.iata)!.push(routeBtoA);
          }
      }
  }

  cachedGraph = graph; 
  
  const graphObject = Object.fromEntries(graph);
  const stringGr = JSON.stringify(graphObject);
  writeFileSync('cached-graph.json', stringGr);
  return graph;
}