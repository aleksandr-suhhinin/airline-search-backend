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
exports.buildGraphWithGroundTransfers = exports.loadRouteData = exports.loadAirportData = exports.cachedGraph = exports.GROUND_LIMIT = void 0;
const parse = require("csv-parse");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("../util");
exports.GROUND_LIMIT = 100;
exports.cachedGraph = null;
function parseCSV(filePath, columns) {
    return new Promise((resolve, reject) => {
        (0, fs_1.readFile)(filePath, (err, data) => {
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
function loadAirportData() {
    return __awaiter(this, void 0, void 0, function* () {
        const columns = ['airportID', 'name', 'city', 'country', 'iata', 'icao', 'latitude', 'longitude'];
        const rows = yield parseCSV((0, path_1.resolve)(__dirname, './airports.dat'), columns);
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
    });
}
exports.loadAirportData = loadAirportData;
function loadRouteData() {
    return __awaiter(this, void 0, void 0, function* () {
        const airports = yield loadAirportData();
        const airportsById = new Map(airports.map((airport) => [airport.id, airport]));
        const columns = ['airline', 'airlineID', 'source', 'sourceID', 'destination', 'destinationID', 'codeshare', 'stops'];
        const rows = yield parseCSV((0, path_1.resolve)(__dirname, './routes.dat'), columns);
        return rows.filter((row) => row.stops === '0').map((row) => {
            const source = airportsById.get(row.sourceID);
            const destination = airportsById.get(row.destinationID);
            if (source === undefined || destination === undefined) {
                return null;
            }
            return {
                source,
                destination,
                distance: (0, util_1.haversine)(source.location.latitude, source.location.longitude, destination.location.latitude, destination.location.longitude),
            };
        }).filter(util_1.notNil);
    });
}
exports.loadRouteData = loadRouteData;
function loadCachedGraph() {
    if (exports.cachedGraph)
        return exports.cachedGraph;
    try {
        const data = (0, fs_1.readFileSync)('cached-graph.json', 'utf-8');
        const graphObject = JSON.parse(data);
        exports.cachedGraph = new Map(Object.entries(graphObject));
    }
    catch (_a) {
        return null;
    }
}
function buildGraphWithGroundTransfers() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.cachedGraph = loadCachedGraph();
        if (exports.cachedGraph) {
            return exports.cachedGraph;
        }
        const routes = yield loadRouteData();
        const airports = yield loadAirportData();
        const graph = new Map();
        for (const route of routes) {
            const sourceCode = route.source.iata;
            if (!sourceCode)
                continue;
            if (!graph.has(sourceCode)) {
                graph.set(sourceCode, []);
            }
            graph.get(sourceCode).push(route);
        }
        const airportList = Array.from(airports.values());
        // adding ground transfers between airports
        for (let i = 0; i < airportList.length; i++) {
            for (let j = i + 1; j < airportList.length; j++) {
                const airportA = airportList[i];
                const airportB = airportList[j];
                const groundDistance = (0, util_1.haversine)(airportA.location.latitude, airportA.location.longitude, airportB.location.latitude, airportB.location.longitude);
                if (groundDistance <= exports.GROUND_LIMIT) {
                    const routeAtoB = {
                        source: airportA,
                        destination: airportB,
                        distance: groundDistance,
                    };
                    const routeBtoA = {
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
                    graph.get(airportA.iata).push(routeAtoB);
                    graph.get(airportB.iata).push(routeBtoA);
                }
            }
        }
        exports.cachedGraph = graph;
        const graphObject = Object.fromEntries(graph);
        const stringGr = JSON.stringify(graphObject);
        (0, fs_1.writeFileSync)('cached-graph.json', stringGr);
        return graph;
    });
}
exports.buildGraphWithGroundTransfers = buildGraphWithGroundTransfers;
