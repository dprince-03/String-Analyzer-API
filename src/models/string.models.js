const crypto = require('crypto');
const { asyncHandler } = require("../middlewares/errorhandler.middlewares");

const createString = asyncHandler(async (stringData) => {
    const {
      id,
      value,
      length,
      is_palindrome,
      unique_characters,
      word_count,
      character_frequency_map
    } = stringData;

    const [result] = await pool.execute(`INSERT INTO analyzed_strings (id, value, length, is_palindrome, unique_characters, word_count, character_frequency_map) VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, value, length, is_palindrome, unique_characters, word_count, JSON.stringify(character_frequency_map)]);

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
});

const findStringById = asyncHandler(async (id) => {
    const [rows] = await pool.execute(`SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency_map, created_at FROM analyzed_strings WHERE id = ?`, [id]);

	if (rows.length === 0) return null;

	const record = rows[0];
	return {
        id: record.id,
		value: record.value,
		length: record.length,
		is_palindrome: Boolean(record.is_palindrome),
		unique_characters: record.unique_characters,
		word_count: record.word_count,
		character_frequency_map: typeof record.character_frequency_map === "string" ? JSON.parse(record.character_frequency_map) : record.character_frequency_map,
		created_at: record.created_at.toISOString(),
	};
});

const FindStringByValue = asyncHandler(async (value) => {
    const crypto = require('crypto');
    const id = crypto.createHash('sha256').update(value).digest('hex');
    return await StringModel.findById(id);
});

const existingStringBtValue = asyncHandler(async (value) => {
    const crypto = require('crypto');
    const id = crypto.createHash('sha256').update(value).digest('hex');
    
    const [rows] = await pool.execute('SELECT 1 FROM analyzed_strings WHERE id = ? LIMIT 1', [id]);

    return rows.length > 0;
});

const findAllStrings = asyncHandler(async (filters = {}) => {
    let query = `SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency_map, created_at FROM analyzed_strings WHERE 1=1`;

    const params = [];

    // Apply filters
    if (filters.is_palindrome !== undefined) {
        query += ' AND is_palindrome = ?';
        params.push(filters.is_palindrome === 'true');
    }

    if (filters.min_length !== undefined) {
        query += ' AND length >= ?';
        params.push(parseInt(filters.min_length));
    }

    if (filters.max_length !== undefined) {
        query += ' AND length <= ?';
        params.push(parseInt(filters.max_length));
    }

    if (filters.word_count !== undefined) {
        query += ' AND word_count = ?';
        params.push(parseInt(filters.word_count));
    }

    if (filters.contains_character !== undefined) {
        query += ' AND JSON_EXTRACT(character_frequency_map, ?) IS NOT NULL';
        params.push(`$.${filters.contains_character.toLowerCase()}`);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);

    return rows.map(record => ({
        id: record.id,
        value: record.value,
        properties: {
            length: record.length,
            is_palindrome: Boolean(record.is_palindrome),
            unique_characters: record.unique_characters,
            word_count: record.word_count,
            sha256_hash: record.id,
            character_frequency_map: typeof record.character_frequency_map === 'string' ? JSON.parse(record.character_frequency_map) : record.character_frequency_map
        },
        created_at: record.created_at.toISOString(),
    }));
});

const deleteStringByValue = asyncHandler(async (value) => {
    const crypto = require('crypto');
    const id = crypto.createHash('sha256').update(value).digest('hex');
    
    const [result] = await pool.execute(
      'DELETE FROM analyzed_strings WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
});

const getStringStatistics = asyncHandler(async () => {
    const [stats] = await pool.execute(`SELECT COUNT(*) as total_strings, AVG(length) as avg_length, MAX(length) as max_length, MIN(length) as min_length, SUM(is_palindrome) as palindrome_count, AVG(word_count) as avg_word_count, MAX(created_at) as last_analyzed FROM analyzed_strings`);

    return stats[0];
});

const searchByPattern = asyncHandler(async (pattern) => {
    const [rows] = await pool.execute(`SELECT id, value, length, is_palindrome, unique_characters, word_count, character_frequency_map, created_at FROM analyzed_strings WHERE value LIKE ? ORDER BY created_at DESC`, [`%${pattern}%`]);

    return rows.map(record => ({
        id: record.id,
        value: record.value,
        properties: {
            length: record.length,
            is_palindrome: Boolean(record.is_palindrome),
            unique_characters: record.unique_characters,
            word_count: record.word_count,
            sha256_hash: record.id,
            character_frequency_map: typeof record.character_frequency_map === 'string' ? JSON.parse(record.character_frequency_map) : record.character_frequency_map
        },
        created_at: record.created_at.toISOString()
    }));
});

// Bulk insert multiple strings (for testing/initial data)
const bulkCreateString = asyncHandler(async (stringArray) => {
    const values = [];
    const placeholders = [];
    const params = [];

    stringsArray.forEach(stringData => {
        const {
            id,
            value,
            length,
            is_palindrome,
            unique_characters,
            word_count,
            character_frequency_map
        } = stringData;

        placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
        params.push(
            id,
            value,
            length,
            is_palindrome,
            unique_characters,
            word_count,
            JSON.stringify(character_frequency_map)
        );
    });

    const query = `INSERT INTO analyzed_strings (id, value, length, is_palindrome, unique_characters, word_count, character_frequency_map) VALUES ${placeholders.join(', ')}`;

    const [result] = await pool.execute(query, params);
    return result.affectedRows;
});

// Clean up old records (for maintenance)
const cleanupOldRecords = asyncHandler(async (daysOld = 30) => {
    const [result] = await pool.execute('DELETE FROM analyzed_strings WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [daysOld]);

    return result.affectedRows;
});

const stringModel = {
	create: createString,
	findById: findStringById,
	findByValue: FindStringByValue,
	existsByValue: existingStringBtValue,
	findAll: findAllStrings,
	deleteByValue: deleteStringByValue,
	getStatistics: getStringStatistics,
	searchByPattern,
	bulkCreate: bulkCreateString,
	cleanupOldRecords,
};

module.exports = stringModel;