const crypto = require("crypto");
const { StringModel } = require('../models/string.models');
const {
	asyncHandler,
	NotFoundError,
	ConflictError,
	ValidationError,
} = require('../middlewares/errorhandler.middlewares');

// String analysis functions
const analyzeString = (inputString) => {
	const trimmedString = inputString.trim();
	const cleanStr = trimmedString.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

	const length = trimmedString.length;
	const isPalindrome = cleanStr.length > 0 && cleanStr === cleanStr.split("").reverse().join("");
	const uniqueCharacters = new Set(trimmedString.toLowerCase().replace(/\s/g, "")).size;
	const wordCount = trimmedString.length === 0 ? 0 : trimmedString.trim().split(/\s+/).length;
	const sha256Hash = crypto.createHash("sha256").update(trimmedString).digest("hex");

	const characterFrequency = {};
	for (const char of trimmedString.toLowerCase()) {
		if (char !== " ") {
			characterFrequency[char] = (characterFrequency[char] || 0) + 1;
		}
	};

	return {
		length,
		is_palindrome: isPalindrome,
		unique_characters: uniqueCharacters,
		word_count: wordCount,
		sha256_hash: sha256Hash,
		character_frequency_map: characterFrequency,
	};
};

// Parse natural language query
const parseNaturalLanguageQuery = (query) => {
	const filters = {};
	const lowerQuery = query.toLowerCase();

	if ( lowerQuery.includes("palindrome") || lowerQuery.includes("reads the same") || lowerQuery.includes("backwards") ) {
		filters.is_palindrome = "true";
	}

	const longerMatch = lowerQuery.match( /(?:longer than|greater than|more than|at least)\s+(\d+)\s*(?:characters?|chars?)?/ );
	if (longerMatch) {
		filters.min_length = (parseInt(longerMatch[1]) + 1).toString();
	}

	const shorterMatch = lowerQuery.match( /(?:shorter than|less than|fewer than)\s+(\d+)\s*(?:characters?|chars?)?/ );
	if (shorterMatch) {
		filters.max_length = (parseInt(shorterMatch[1]) - 1).toString();
	}

	if (lowerQuery.includes("single word") || lowerQuery.includes("one word")) {
		filters.word_count = "1";
	}

	const wordCountMatch = lowerQuery.match(/(\d+)\s*words?/);
	if (wordCountMatch) {
		filters.word_count = wordCountMatch[1];
	}

	const charMatch = lowerQuery.match( /(?:containing|contains|with|having)\s+(?:the\s+)?(?:letter|character)\s+['"]?([a-zA-Z])['"]?/ );
	if (charMatch) {
		filters.contains_character = charMatch[1].toLowerCase();
	}

	if (lowerQuery.includes("vowel")) {
		filters.contains_character = "a";
	}

	return filters;
};

const createString = asyncHandler(async (req, res) => {
	const { value } = req.body;
	const trimmedValue = value.trim();

	const exists = await StringModel.existsByValue(trimmedValue);
	if (exists) {
		throw new ConflictError("String already exists in the system");
	}

	const properties = analyzeString(trimmedValue);

	const stringData = {
		id: properties.sha256_hash,
		value: trimmedValue,
		length: properties.length,
		is_palindrome: properties.is_palindrome,
		unique_characters: properties.unique_characters,
		word_count: properties.word_count,
		character_frequency_map: properties.character_frequency_map,
	};

	await StringModel.create(stringData);

	const response = {
		id: properties.sha256_hash,
		value: trimmedValue,
		properties,
		created_at: new Date().toISOString(),
	};

	res.status(201).json(response);
});

const getString = asyncHandler(async (req, res) => {
	const { string_value } = req.params;
	const decodedString = decodeURIComponent(string_value);

	const stringRecord = await StringModel.findByValue(decodedString);

	if (!stringRecord) {
		throw new NotFoundError("String");
	}

	const response = {
		id: stringRecord.id,
		value: stringRecord.value,
		properties: {
			length: stringRecord.length,
			is_palindrome: stringRecord.is_palindrome,
			unique_characters: stringRecord.unique_characters,
			word_count: stringRecord.word_count,
			sha256_hash: stringRecord.id,
			character_frequency_map: stringRecord.character_frequency_map,
		},
		created_at: stringRecord.created_at,
	};

	res.status(200).json(response);
});

const getAllStrings = asyncHandler(async (req, res) => {
	const strings = await StringModel.findAll(req.query);

	const response = {
		data: strings,
		count: strings.length,
		filters_applied: req.query,
	};

	res.status(200).json(response);
});

const filterByNaturalLanguage = asyncHandler(async (req, res) => {
	const { query } = req.query;

	const parsedFilters = parseNaturalLanguageQuery(query);

	if (Object.keys(parsedFilters).length === 0) {
		throw new ValidationError("Unable to parse natural language query");
	}

	const strings = await StringModel.findAll(parsedFilters);

	const response = {
		data: strings,
		count: strings.length,
		interpreted_query: {
			original: query,
			parsed_filters: parsedFilters,
		},
	};

	res.status(200).json(response);
});

const deleteString = asyncHandler(async (req, res) => {
	const { string_value } = req.params;
	const decodedString = decodeURIComponent(string_value);

	const deleted = await StringModel.deleteByValue(decodedString);

	if (!deleted) {
		throw new NotFoundError("String");
	}

	res.status(204).send();
});

// Get statistics
const getStatistics = asyncHandler(async (req, res) => {
	const stats = await StringModel.getStatistics();

	res.status(200).json({
		statistics: stats,
		generated_at: new Date().toISOString(),
	});
});

module.exports = {
	createString,
	getString,
	getAllStrings,
	filterByNaturalLanguage,
	deleteString,
	getStatistics,
};
