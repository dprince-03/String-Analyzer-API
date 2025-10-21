const express = require('express');
const { 
    validateStringInput, 
    validateQueryParams,
    validateNaturalLanguageQuery
} = require('../middlewares/validator.middlewares');
const { 
    createString, 
    getString,
    getAllStrings,
    filterByNaturalLanguage,
    getStatistics,
    deleteString
} = require('../controllers/string.controllers');

const stringRouter = express.Router();


// POST /strings - Create/Analyze String
stringRouter.post('/strings', validateStringInput, createString);

// GET /strings/:string_value - Get Specific String
stringRouter.get('/strings/:string_value', getString);

// GET /strings - Get All Strings with Filtering
stringRouter.get('/strings', validateQueryParams, getAllStrings);

// GET /strings/filter-by-natural-language - Natural Language Filtering
stringRouter.get('/strings/filter-by-natural-language', validateNaturalLanguageQuery, filterByNaturalLanguage);

// GET /strings/stats/statistics - Get statistics
stringRouter.get('/strings/stats/statistics', getStatistics);

// DELETE /strings/:string_value - Delete String
stringRouter.delete('/strings/:string_value', deleteString);


module.exports = stringRouter;