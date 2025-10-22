-- Create Database 
CREATE DATABASE IF NOT EXISTS string_analyzer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE string_analyzer_db;

-- Create table 
CREATE TABLE IF NOT EXISTS strings(
    id VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    length INT UNSIGNED NOT NULL,
    is_palindrome BOOLEAN NOT NULL DEFAULT FALSE,
    unique_characters INT UNSIGNED NOT NULL,
    word_count INT UNSIGNED NOT NULL,
    character_frequency JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

-- Indexing
    INDEX idx_is_palindrome (is_palindrome),
    INDEX idx_length (length),
    INDEX idx_word_count (word_count),
    INDEX idx_created_at (created_at),
    INDEX idx_value_prefix (value(100)),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE INDEX IF NOT EXISTS idx_string_value_prefix ON strings (value(100));
CREATE INDEX IF NOT EXISTS idx_unique_chars ON strings (unique_characters);
CREATE INDEX IF NOT EXISTS idx_character_frequency ON strings ((JSON_KEYS(character_frequency_map)));

-- Statistics view
CREATE VIEW string_statistics AS
SELECT 
    COUNT(*) as total_strings,
    AVG(length) as average_length,
    MAX(length) as max_length,
    MIN(length) as min_length,
    SUM(is_palindrome) as total_palindromes,
    AVG(word_count) as average_word_count,
    MAX(created_at) as last_analysis
FROM strings;