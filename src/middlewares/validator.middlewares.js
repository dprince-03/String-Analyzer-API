const { ValidationError } = require('./errorhandler.middlewares');

const validateStringInput = (req, res, next) => {
	const { value } = req.body;

	if (value === undefined || value === null) {
		throw new ValidationError('Missing "value" field in request body');
	}

	if (typeof value !== "string") {
		throw new ValidationError('Invalid data type for "value" (must be string)');
	}

	if (value.trim().length === 0) {
		throw new ValidationError(
			"String value cannot be empty or only whitespace"
		);
	}

	if (value.length > 10000) {
		throw new ValidationError("String value too long (max 10000 characters)");
	}

	next();
};

const validateQueryParams = (req, res, next) => {
	const {
		is_palindrome,
		min_length,
		max_length,
		word_count,
		contains_character,
	} = req.query;

	if (is_palindrome && !["true", "false"].includes(is_palindrome)) {
		throw new ValidationError(
			"Invalid value for is_palindrome (must be true or false)"
		);
	}

	if (min_length && (isNaN(min_length) || parseInt(min_length) < 0)) {
		throw new ValidationError(
			"Invalid value for min_length (must be a positive integer)"
		);
	}

	if (max_length && (isNaN(max_length) || parseInt(max_length) < 0)) {
		throw new ValidationError(
			"Invalid value for max_length (must be a positive integer)"
		);
	}

	if (min_length && max_length && parseInt(min_length) > parseInt(max_length)) {
		throw new ValidationError("min_length cannot be greater than max_length");
	}

	if (word_count && (isNaN(word_count) || parseInt(word_count) < 0)) {
		throw new ValidationError(
			"Invalid value for word_count (must be a positive integer)"
		);
	}

	if (
		contains_character &&
		(typeof contains_character !== "string" || contains_character.length !== 1)
	) {
		throw new ValidationError(
			"Invalid value for contains_character (must be a single character)"
		);
	}

	next();
};

const validateNaturalLanguageQuery = (req, res, next) => {
	const { query } = req.query;

	if (!query || typeof query !== "string") {
		throw new ValidationError('Missing or invalid "query" parameter');
	}

	if (query.trim().length === 0) {
		throw new ValidationError("Query cannot be empty");
	}

	if (query.length > 500) {
		throw new ValidationError("Query too long (max 500 characters)");
	}

	next();
};

module.exports = {
	validateStringInput,
	validateQueryParams,
	validateNaturalLanguageQuery,
};
