"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestion = void 0;
function suggestion(queryString, airports) {
    if (queryString.length < 3) {
        return [];
    }
    return airports
        .filter(airport => {
        var _a, _b;
        return ((_a = airport === null || airport === void 0 ? void 0 : airport.iata) === null || _a === void 0 ? void 0 : _a.startsWith(queryString.toUpperCase())) ||
            ((_b = airport === null || airport === void 0 ? void 0 : airport.name) === null || _b === void 0 ? void 0 : _b.toUpperCase().startsWith(queryString.toUpperCase()));
    });
}
exports.suggestion = suggestion;
