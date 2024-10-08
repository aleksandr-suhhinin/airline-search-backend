"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversine = exports.radians = exports.flatten = exports.notNil = void 0;
function notNil(value) {
    return value !== undefined && value !== null;
}
exports.notNil = notNil;
function flatten(value) {
    return value.reduce((memo, value) => {
        return [...memo, ...value];
    }, []);
}
exports.flatten = flatten;
function radians(degrees) {
    return degrees * (Math.PI / 180.0);
}
exports.radians = radians;
function haversine(lat1, lon1, lat2, lon2) {
    lat1 = radians(lat1);
    lon1 = radians(lon1);
    lat2 = radians(lat2);
    lon2 = radians(lon2);
    const lat = lat2 - lat1;
    const lon = lon2 - lon1;
    const d = Math.pow(Math.sin(lat * 0.5), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(lon * 0.5), 2);
    const earthRadiusKm = 6371.0088;
    return 2.0 * earthRadiusKm * Math.asin(Math.sqrt(d));
}
exports.haversine = haversine;
