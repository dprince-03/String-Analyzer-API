const crypto = require("crypto");
const stringModel = require("../models/string.models");
const {
	asyncHandler,
	NotFoundError,
	ConflictError,
	ValidationError,
} = require("../middlewares/errorhandler.middlewares");

// Analyze string
const analyzeString = (inputString) => {
	const trimmedString = inputString.trim();
	const cleanStr = trimmedString.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

	const length = trimmedString.length;
	const isPalindrome =
		cleanStr.length > 0 && cleanStr === cleanStr.split("").reverse().join("");
	const uniqueCharacters = new Set(
		trimmedString.toLowerCase().replace(/\s/g, "")
	).size;
	const wordCount =
		trimmedString.length === 0 ? 0 : trimmedString.trim().split(/\s+/).length;
	const sha256Hash = crypto
		.createHash("sha256")
		.update(trimmedString)
		.digest("hex");

	const characterFrequency = {};
	for (const char of trimmedString.toLowerCase()) {
		if (char !== " ") {
			characterFrequency[char] = (characterFrequency[char] || 0) + 1;
		}
	}

	return {
		length,
		is_palindrome: isPalindrome,
		unique_characters: uniqueCharacters,
		word_count: wordCount,
		sha256_hash: sha256Hash,
		character_frequency_map: characterFrequency,
	};
};

// Natural language filter parser
const parseNaturalLanguageQuery = (query) => {
    const filters = {};
    const lowerQuery = query.toLowerCase();

    // Palindrome detection - handle multiple variations
    if (lowerQuery.match(/palindrome|palindromic/)) {
        filters.is_palindrome = "true";
    }

    // Word count patterns
    if (lowerQuery.match(/single word|one word|1 word/)) {
        filters.word_count = "1";
    }
    if (lowerQuery.match(/two words|2 words/)) {
        filters.word_count = "2";
    }
    if (lowerQuery.match(/three words|3 words/)) {
        filters.word_count = "3";
    }
    
    // Extract exact word count if specified as "X words"
    const exactWords = lowerQuery.match(/(\d+)\s+words?/);
    if (exactWords) {
        filters.word_count = exactWords[1];
    }

    // Length filters - "longer than X"
    const longer = lowerQuery.match(/longer than (\d+)/);
    if (longer) {
        filters.min_length = (parseInt(longer[1]) + 1).toString();
    }

    // Length filters - "shorter than X"
    const shorter = lowerQuery.match(/shorter than (\d+)/);
    if (shorter) {
        filters.max_length = (parseInt(shorter[1]) - 1).toString();
    }

    // Length filters - "at least X characters"
    const atLeast = lowerQuery.match(/at least (\d+)/);
    if (atLeast) {
        filters.min_length = atLeast[1];
    }

    // Length filters - "at most X characters"
    const atMost = lowerQuery.match(/at most (\d+)/);
    if (atMost) {
        filters.max_length = atMost[1];
    }

    // Length filters - "more than X"
    const moreThan = lowerQuery.match(/more than (\d+)/);
    if (moreThan) {
        filters.min_length = (parseInt(moreThan[1]) + 1).toString();
    }

    // Length filters - "less than X"
    const lessThan = lowerQuery.match(/less than (\d+)/);
    if (lessThan) {
        filters.max_length = (parseInt(lessThan[1]) - 1).toString();
    }

    // Length filters - "between X and Y"
    const between = lowerQuery.match(/between (\d+) and (\d+)/);
    if (between) {
        filters.min_length = between[1];
        filters.max_length = between[2];
    }

    // Character detection - "contains letter X" or "with letter X"
    const charMatch = lowerQuery.match(/(?:contains?|with|having|include|includes?)\s+(?:letter|character|the letter|the character)\s+['"]?([a-zA-Z])['"]?/);
    if (charMatch) {
        filters.contains_character = charMatch[1].toLowerCase();
    }

    // Vowel detection
    if (lowerQuery.match(/contains?\s+(?:a\s+)?vowel|with\s+(?:a\s+)?vowel|having\s+(?:a\s+)?vowel/)) {
        // Default to 'a' but could be enhanced to check for any vowel
        filters.contains_character = "a";
    }

    // Consonant detection (example with 'b')
    if (lowerQuery.match(/contains?\s+(?:a\s+)?consonant|with\s+(?:a\s+)?consonant/)) {
        filters.contains_character = "b";
    }

    return filters;
};

// POST /strings
const createString = asyncHandler(async (req, res) => {
	const { value } = req.body;
	if (!value || typeof value !== "string")
		throw new ValidationError('Missing or invalid "value" field');

	const trimmedValue = value.trim();

	const exists = await stringModel.existsByValue(trimmedValue);
	if (exists) {
		throw new ConflictError(`String "${trimmedValue}" already exists`);
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

	await stringModel.create(stringData);

	res.status(201).json({
		id: properties.sha256_hash,
		value: trimmedValue,
		properties,
		created_at: new Date().toISOString(),
	});
});

// GET /strings/:string_value
const getString = asyncHandler(async (req, res) => {
	const decoded = decodeURIComponent(req.params.string_value).trim();
	const hash = crypto.createHash("sha256").update(decoded).digest("hex");
	console.log("Looking for:", decoded, "| Hash:", hash);

	let record = await stringModel.findByValue(decoded);
	if (!record) {
		console.log("Hash lookup failed. Trying raw value...");
		record = await stringModel.findByRawValue(decoded);
	}

	if (!record) throw new NotFoundError(`String "${decoded}" not found`);

	res.status(200).json({
		id: record.id,
		value: record.value,
		properties: {
			length: record.length,
			is_palindrome: record.is_palindrome,
			unique_characters: record.unique_characters,
			word_count: record.word_count,
			sha256_hash: record.id,
			character_frequency_map: record.character_frequency,
		},
		created_at: record.created_at,
	});
});

// GET /strings
const getAllStrings = asyncHandler(async (req, res) => {
	const strings = (await stringModel.findAll(req.query)) || [];

	res.status(200).json({
		data: strings,
		count: strings.length,
		filters_applied: req.query,
	});
});

// GET /strings/filter-by-natural-language
const filterByNaturalLanguage = asyncHandler(async (req, res) => {
	const { query } = req.query;
	if (!query) throw new ValidationError("Missing 'query' parameter");

	const filters = parseNaturalLanguageQuery(query);
	if (Object.keys(filters).length === 0)
		throw new ValidationError("Unable to parse natural language query");

	const strings = await stringModel.findAll(filters);
	res.status(200).json({
		data: strings,
		count: strings.length,
		interpreted_query: {
			original: query,
			parsed_filters: filters,
		},
	});
});

// DELETE /strings/:string_value
const deleteString = asyncHandler(async (req, res) => {
	const decoded = decodeURIComponent(req.params.string_value).trim();
	const deleted = await stringModel.deleteByValue(decoded);
	if (!deleted) throw new NotFoundError(`String "${decoded}" not found`);
	res.status(204).send();
});

// GET /strings/stats/statistics
const getStatistics = asyncHandler(async (req, res) => {
	const stats = await stringModel.getStatistics();
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