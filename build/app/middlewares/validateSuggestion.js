"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSuggestion = void 0;
const validateSuggestion = (req, res, next) => {
    const airport = req.params['airport'];
    if (!airport || airport.length < 3) {
        return res.status(400).json({
            error: 'Airport parameter must be at least 3 characters long'
        });
    }
    next();
};
exports.validateSuggestion = validateSuggestion;
