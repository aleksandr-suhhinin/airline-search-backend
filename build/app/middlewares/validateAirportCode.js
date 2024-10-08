"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAirportCode = void 0;
function validateAirportCode(airportsByCode) {
    return (req, res, next) => {
        const code = req.params['code'];
        if (!code) {
            return res.status(400).send('Must provide airport code');
        }
        const airport = airportsByCode.get(code.toLowerCase());
        if (!airport) {
            return res.status(404).send('No such airport, please provide a valid IATA/ICAO code');
        }
        req.airport = airport;
        next();
    };
}
exports.validateAirportCode = validateAirportCode;
