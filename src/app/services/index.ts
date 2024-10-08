import { Airport, buildGraphWithGroundTransfers, loadAirportData, loadRouteData, Route } from "../../data";
import { haversine } from "../../util";
import * as PriorityQueue from 'js-priority-queue';

class HeapPriorityQueue<T> {
    private queue: PriorityQueue<{ element: T; priority: number }>;

    constructor() {
        // Initialize the priority queue using a comparator for min-heap
        this.queue = new PriorityQueue({
            comparator: (a, b) => a.priority - b.priority // Min-heap: smallest priority on top
        });
    }

    enqueue(element: T, priority: number) {
        // Enqueue an element with its priority
        this.queue.queue({ element, priority });
    }

    dequeue(): { element: T; priority: number } | undefined {
        // Dequeue the element with the highest priority (smallest distance)
        return this.queue.dequeue();
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }
}

export type Hop = Omit<Airport, 'id' | 'icao' | 'nearbyAirports'>;

export interface CalculationResult {
    source: string, 
    destination: string,
    hops: Hop[];
    distance: number;
}

interface NearbyAirport {
    airport: Airport;
    distance: number;
}

let cachedNearbyAirports: Map<string, NearbyAirport[]> | null = null;

const GROUND_LIMIT = 100;

function findNearbyAirports(
    airport: Airport,
    airports: Map<string, Airport>,
    maxDistance: number
): NearbyAirport[] {
    const nearbyAirports: NearbyAirport[] = [];
    if (cachedNearbyAirports && cachedNearbyAirports.has(airport.iata)) {
        return cachedNearbyAirports.get(airport.iata);
    }

    for (const otherAirport of airports.values()) {
        if (otherAirport.iata === airport.iata) continue;

        const distance = haversine(
            airport.location.latitude,
            airport.location.longitude,
            otherAirport.location.latitude,
            otherAirport.location.longitude
        );

        if (distance <= maxDistance) {
            nearbyAirports.push({ airport: otherAirport, distance });
        }
    }
    if (!cachedNearbyAirports) {
        cachedNearbyAirports = new Map();
    }
    cachedNearbyAirports.set(airport.iata, nearbyAirports);
    return nearbyAirports;
}

function dijkstraWithLimitedHops(
    graph: Map<string, Route[]>, 
    airports: Map<string, Airport>,
    source: string, 
    destination: string, 
    maxLegs: number, 
    withGroundTransfers: boolean
): CalculationResult | null {
    const distances: Map<string, number[]> = new Map();
    const previous: Map<string, (string | null)[]> = new Map();
    const pq = new HeapPriorityQueue<{ airport: string; hops: number; distance: number }>(); // Use the heap-based priority queue
    graph.forEach((_, airport) => {
        distances.set(airport, Array(maxLegs + 1).fill(Infinity));
        previous.set(airport, Array(maxLegs + 1).fill(null));
    });

    distances.get(source)![0] = 0; 
    pq.enqueue({ airport: source, hops: 0, distance: 0 }, 0);

    while (!pq.isEmpty()) {
        const { airport: currentAirport, hops: currentHops, distance: currentDistance } = pq.dequeue()!.element;

        if (currentAirport === destination && currentHops <= maxLegs) {
            const path: Hop[] = [];
            let step: string | null = currentAirport;
            let stepHops = currentHops;
            while (step) {
                const airport = airports.get(step.toLowerCase())
                path.unshift(airport);
                step = previous.get(step)![stepHops--];
            }
            return {
                source, 
                destination,  
                distance: currentDistance,
                hops: path
            };
        }

        const routes = graph.get(currentAirport);
        if (!routes) continue;
        
        if (withGroundTransfers) {
            const currentAirportData = airports.get(currentAirport.toLowerCase());

            if (currentAirportData) {
                const nearbyAirports = findNearbyAirports(currentAirportData, airports, 100);
                for (const { airport: nearbyAirport, distance: groundDistance } of nearbyAirports) {
                    const groundRoute: Route = {
                        source: currentAirportData,
                        destination: nearbyAirport,
                        distance: groundDistance,
                    };
                    if (!routes.some(r => r.destination.iata === nearbyAirport.iata && r.distance === groundDistance)) {
                        routes.push(groundRoute);
                    }
                }
            }
        }

        for (const route of routes) {
            const neighbor = route.destination.iata;
            if (!neighbor) continue;

            const newDistance = currentDistance + route.distance;
            const newHops = currentHops + 1;

            if (newHops > maxLegs) continue;

            if (!distances.has(neighbor)) {
                distances.set(neighbor, Array(maxLegs + 1).fill(Infinity));
                previous.set(neighbor, Array(maxLegs + 1).fill(null));
            }

            if (newDistance < distances.get(neighbor)![newHops]) {
                distances.get(neighbor)![newHops] = newDistance;
                previous.get(neighbor)![newHops] = currentAirport;
                pq.enqueue({ airport: neighbor, hops: newHops, distance: newDistance }, newDistance);
            }
        }
    }

    return {
        source, 
        destination,  
        distance: 0,
        hops: []
    };
}

async function buildGraph(): Promise<Map<string, Route[]>> {
    const graph: Map<string, Route[]> = await buildGraphWithGroundTransfers();
    return graph;
}


export async function calculateRoute(from: string, to: string, airports: Map<string, Airport>, withGroundTransfers: boolean = false): Promise<CalculationResult | null> {
    const maxLegs = 4;
    const graph = await buildGraph();
    return dijkstraWithLimitedHops(graph, airports, from.toUpperCase(), to.toUpperCase(), maxLegs, withGroundTransfers);
}