"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSourceAndDestination = void 0;
function validateSourceAndDestination(airportsByCode) {
    return (req, res, next) => {
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
exports.validateSourceAndDestination = validateSourceAndDestination;
