const crypto = require("crypto");
const { pool } = require("../config/db.config");

// Remove asyncHandler wrapper for model functions - it's meant for controllers
const createString = async (stringData) => {
	const {
		id,
		value,
		length,
		is_palindrome,
		unique_characters,
		word_count,
		character_frequency_map,
	} = stringData;

	const [result] = await pool.execute(
		`INSERT INTO strings (id, value, length, is_palindrome, unique_characters, word_count, character_frequency) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			value,
			length,
			is_palindrome,
			unique_characters,
			word_count,
			JSON.stringify(character_frequency_map),
		]
	);

	return {
		id,
		value,
		length,
		is_palindrome,
		unique_characters,
		word_count,
		character_frequency_map,
		created_at: new Date().toISOString(),
	};
};

const findStringById = async (id) => {
	const [rows] = await pool.execute(
		`SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency, created_at 
         FROM strings WHERE id = ? LIMIT 1`,
		[id]
	);

	if (rows.length === 0) return null;

	const record = rows[0];
	return {
		id: record.id,
		value: record.value,
		length: record.length,
		is_palindrome: Boolean(record.is_palindrome),
		unique_characters: record.unique_characters,
		word_count: record.word_count,
		character_frequency:
			typeof record.character_frequency === "string"
				? JSON.parse(record.character_frequency)
				: record.character_frequency,
		created_at: record.created_at
			? new Date(record.created_at).toISOString()
			: null,
	};
};

const findStringByValue = async (value) => {
	const id = crypto.createHash("sha256").update(value).digest("hex");
	return await findStringById(id);
};

const findStringByRawValue = async (value) => {
	const [rows] = await pool.execute(
		`SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency, created_at 
         FROM strings WHERE value = ? LIMIT 1`,
		[value]
	);

	if (rows.length === 0) return null;

	const record = rows[0];
	return {
		id: record.id,
		value: record.value,
		length: record.length,
		is_palindrome: Boolean(record.is_palindrome),
		unique_characters: record.unique_characters,
		word_count: record.word_count,
		character_frequency:
			typeof record.character_frequency === "string"
				? JSON.parse(record.character_frequency)
				: record.character_frequency,
		created_at: record.created_at
			? new Date(record.created_at).toISOString()
			: null,
	};
};

const existingStringByValue = async (value) => {
	const id = crypto.createHash("sha256").update(value).digest("hex");
	const [rows] = await pool.execute(
		"SELECT 1 FROM strings WHERE id = ? LIMIT 1",
		[id]
	);
	return rows.length > 0;
};

const findAllStrings = async (filters = {}) => {
	let query = `
        SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency, created_at 
        FROM strings WHERE 1=1
    `;
	const params = [];

	if (filters.is_palindrome !== undefined) {
		query += " AND is_palindrome = ?";
		params.push(
			filters.is_palindrome === "true" || filters.is_palindrome === true
		);
	}
	if (filters.min_length) {
		query += " AND length >= ?";
		params.push(parseInt(filters.min_length));
	}
	if (filters.max_length) {
		query += " AND length <= ?";
		params.push(parseInt(filters.max_length));
	}
	if (filters.word_count) {
		query += " AND word_count = ?";
		params.push(parseInt(filters.word_count));
	}
	if (filters.contains_character) {
		query += " AND JSON_EXTRACT(character_frequency, ?) IS NOT NULL";
		params.push(`$.${filters.contains_character.toLowerCase()}`);
	}

	query += " ORDER BY created_at DESC";

	const [rows] = await pool.execute(query, params);

	return rows.map((r) => ({
		id: r.id,
		value: r.value,
		properties: {
			length: r.length,
			is_palindrome: Boolean(r.is_palindrome),
			unique_characters: r.unique_characters,
			word_count: r.word_count,
			sha256_hash: r.id,
			character_frequency:
				typeof r.character_frequency === "string"
					? JSON.parse(r.character_frequency)
					: r.character_frequency,
		},
		created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
	}));
};

const deleteStringByValue = async (value) => {
	const id = crypto.createHash("sha256").update(value).digest("hex");
	const [result] = await pool.execute("DELETE FROM strings WHERE id = ?", [id]);
	return result.affectedRows > 0;
};

const getStringStatistics = async () => {
	const [stats] = await pool.execute(
		`SELECT 
            COUNT(*) as total_strings, 
            AVG(length) as avg_length, 
            MAX(length) as max_length, 
            MIN(length) as min_length, 
            SUM(is_palindrome) as palindrome_count, 
            AVG(word_count) as avg_word_count, 
            MAX(created_at) as last_analyzed 
         FROM strings`
	);
	return stats[0];
};

const searchByPattern = async (pattern) => {
	const [rows] = await pool.execute(
		`SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency, created_at 
         FROM strings WHERE value LIKE ? ORDER BY created_at DESC`,
		[`%${pattern}%`]
	);

	return rows.map((record) => ({
		id: record.id,
		value: record.value,
		properties: {
			length: record.length,
			is_palindrome: Boolean(record.is_palindrome),
			unique_characters: record.unique_characters,
			word_count: record.word_count,
			sha256_hash: record.id,
			character_frequency:
				typeof record.character_frequency === "string"
					? JSON.parse(record.character_frequency)
					: record.character_frequency,
		},
		created_at: record.created_at.toISOString(),
	}));
};

const bulkCreateString = async (stringArray) => {
	const placeholders = [];
	const params = [];

	stringArray.forEach((stringData) => {
		const {
			id,
			value,
			length,
			is_palindrome,
			unique_characters,
			word_count,
			character_frequency,
		} = stringData;

		placeholders.push("(?, ?, ?, ?, ?, ?, ?)");
		params.push(
			id,
			value,
			length,
			is_palindrome,
			unique_characters,
			word_count,
			JSON.stringify(character_frequency)
		);
	});

	const query = `INSERT INTO strings (id, value, length, is_palindrome, unique_characters, word_count, character_frequency) 
                   VALUES ${placeholders.join(", ")}`;

	const [result] = await pool.execute(query, params);
	return result.affectedRows;
};

const cleanupOldRecords = async (daysOld = 30) => {
	const [result] = await pool.execute(
		"DELETE FROM strings WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
		[daysOld]
	);
	return result.affectedRows;
};

const stringModel = {
	create: createString,
	findById: findStringById,
	findByValue: findStringByValue,
	findByRawValue: findStringByRawValue,
	existsByValue: existingStringByValue,
	findAll: findAllStrings,
	deleteByValue: deleteStringByValue,
	getStatistics: getStringStatistics,
	searchByPattern,
	bulkCreate: bulkCreateString,
	cleanupOldRecords,
};

module.exports = stringModel;
