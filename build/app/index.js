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
exports.createApp = void 0;
const express = require("express");
const cors = require("cors");
const util_1 = require("../util");
const data_1 = require("../data");
const services_1 = require("./services");
const middlewares_1 = require("./middlewares");
const suggestion_1 = require("./services/suggestion");
function createApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = express();
        const airports = yield (0, data_1.loadAirportData)();
        yield (0, data_1.buildGraphWithGroundTransfers)();
        const airportsByCode = new Map((0, util_1.flatten)(airports.map((airport) => [
            airport.iata !== null ? [airport.iata.toLowerCase(), airport] : null,
            airport.icao !== null ? [airport.icao.toLowerCase(), airport] : null,
        ].filter(util_1.notNil))));
        app.use(cors({
            origin: 'http://localhost:3001'
        }));
        app.get('/health', (_, res) => res.send('OK'));
        app.get('/airports/:code', (0, middlewares_1.validateAirportCode)(airportsByCode), (req, res) => {
            const airport = req.airport;
            return res.status(200).send(airport);
        });
        app.get('/routes/:source/:destination', (0, middlewares_1.validateSourceAndDestination)(airportsByCode), (req, res) => __awaiter(this, void 0, void 0, function* () {
            const source = req.params['source'];
            const destination = req.params['destination'];
            const withGroundTransfer = req.query['with-ground-hops'] !== undefined;
            const result = yield (0, services_1.calculateRoute)(source, destination, airportsByCode, withGroundTransfer);
            return res.status(200).send(result);
        }));
        app.get('/suggestions/:airport', middlewares_1.validateSuggestion, (req, res) => __awaiter(this, void 0, void 0, function* () {
            const queryString = req.params['airport'];
            const result = (0, suggestion_1.suggestion)(queryString, airports);
            return res.status(200).send(result);
        }));
        return app;
    });
}
exports.createApp = createApp;
