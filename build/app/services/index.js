"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRoute = void 0;
const data_1 = require("../../data");
const util_1 = require("../../util");
const PriorityQueue = require("js-priority-queue");
class HeapPriorityQueue {
    constructor() {
        // Initialize the priority queue using a comparator for min-heap
        this.queue = new PriorityQueue({
            comparator: (a, b) => a.priority - b.priority // Min-heap: smallest priority on top
        });
    }
    enqueue(element, priority) {
        // Enqueue an element with its priority
        this.queue.queue({ element, priority });
    }
    dequeue() {
        // Dequeue the element with the highest priority (smallest distance)
        return this.queue.dequeue();
    }
    isEmpty() {
        return this.queue.length === 0;
    }
}
let cachedNearbyAirports = null;
const GROUND_LIMIT = 100;
function findNearbyAirports(airport, airports, maxDistance) {
    const nearbyAirports = [];
    if (cachedNearbyAirports && cachedNearbyAirports.has(airport.iata)) {
        return cachedNearbyAirports.get(airport.iata);
    }
    for (const otherAirport of airports.values()) {
        if (otherAirport.iata === airport.iata)
            continue;
        const distance = (0, util_1.haversine)(airport.location.latitude, airport.location.longitude, otherAirport.location.latitude, otherAirport.location.longitude);
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
function dijkstraWithLimitedHops(graph, airports, source, destination, maxLegs, withGroundTransfers) {
    const distances = new Map();
    const previous = new Map();
    const pq = new HeapPriorityQueue(); // Use the heap-based priority queue
    graph.forEach((_, airport) => {
        distances.set(airport, Array(maxLegs + 1).fill(Infinity));
        previous.set(airport, Array(maxLegs + 1).fill(null));
    });
    distances.get(source)[0] = 0;
    pq.enqueue({ airport: source, hops: 0, distance: 0 }, 0);
    while (!pq.isEmpty()) {
        const { airport: currentAirport, hops: currentHops, distance: currentDistance } = pq.dequeue().element;
        if (currentAirport === destination && currentHops <= maxLegs) {
            const path = [];
            let step = currentAirport;
            let stepHops = currentHops;
            while (step) {
                const airport = airports.get(step.toLowerCase());
                path.unshift(airport);
                step = previous.get(step)[stepHops--];
            }
            return {
                source,
                destination,
                distance: currentDistance,
                hops: path
            };
        }
        const routes = graph.get(currentAirport);
        if (!routes)
            continue;
        if (withGroundTransfers) {
            const currentAirportData = airports.get(currentAirport.toLowerCase());
            if (currentAirportData) {
                const nearbyAirports = findNearbyAirports(currentAirportData, airports, 100);
                for (const { airport: nearbyAirport, distance: groundDistance } of nearbyAirports) {
                    const groundRoute = {
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
            if (!neighbor)
                continue;
            const newDistance = currentDistance + route.distance;
            const newHops = currentHops + 1;
            if (newHops > maxLegs)
                continue;
            if (!distances.has(neighbor)) {
                distances.set(neighbor, Array(maxLegs + 1).fill(Infinity));
                previous.set(neighbor, Array(maxLegs + 1).fill(null));
            }
            if (newDistance < distances.get(neighbor)[newHops]) {
                distances.get(neighbor)[newHops] = newDistance;
                previous.get(neighbor)[newHops] = currentAirport;
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
function buildGraph() {
    return __awaiter(this, void 0, void 0, function* () {
        const graph = yield (0, data_1.buildGraphWithGroundTransfers)();
        return graph;
    });
}
function calculateRoute(from, to, airports, withGroundTransfers = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const maxLegs = 4;
        const graph = yield buildGraph();
        return dijkstraWithLimitedHops(graph, airports, from.toUpperCase(), to.toUpperCase(), maxLegs, withGroundTransfers);
    });
}
exports.calculateRoute = calculateRoute;
