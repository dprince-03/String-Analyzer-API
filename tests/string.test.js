const request = require("supertest");
const app = require("../server");
const { pool } = require("../src/config/db.config");

// Test data
const testStrings = {
	palindrome: "madam",
	notPalindrome: "hello",
	singleWord: "test",
	multiWord: "hello world",
	longString: "this is a very long string for testing",
};

// Helper function to clean up test data
const cleanupTestData = async () => {
	await pool.execute("DELETE FROM strings WHERE value IN (?, ?, ?, ?, ?)", [
		testStrings.palindrome,
		testStrings.notPalindrome,
		testStrings.singleWord,
		testStrings.multiWord,
		testStrings.longString,
	]);
};

// Setup and teardown
beforeAll(async () => {
	await cleanupTestData();
});

afterAll(async () => {
	await cleanupTestData();
	await pool.end();
	// Give time for connections to close
	await new Promise((resolve) => setTimeout(resolve, 500));
});

describe("String Analyzer API Tests", () => {
	// ==========================================
	// POST /api/strings - Create String
	// ==========================================
	describe("POST /api/strings", () => {
		test("should create a new string successfully", async () => {
			const response = await request(app)
				.post("/api/strings")
				.send({ value: testStrings.palindrome })
				.expect("Content-Type", /json/)
				.expect(201);

			expect(response.body).toHaveProperty("id");
			expect(response.body).toHaveProperty("value", testStrings.palindrome);
			expect(response.body).toHaveProperty("properties");
			expect(response.body.properties).toHaveProperty("length", 5);
			expect(response.body.properties).toHaveProperty("is_palindrome", true);
			expect(response.body.properties).toHaveProperty("word_count", 1);
		});

		test("should reject duplicate string", async () => {
			await request(app)
				.post("/api/strings")
				.send({ value: testStrings.palindrome })
				.expect(409);
		});

		test("should reject empty string", async () => {
			await request(app).post("/api/strings").send({ value: "" }).expect(400);
		});

		test("should reject missing value field", async () => {
			await request(app).post("/api/strings").send({}).expect(400);
		});

		test("should reject non-string value", async () => {
			await request(app)
				.post("/api/strings")
				.send({ value: 12345 })
				.expect(400);
		});
	});

	// ==========================================
	// GET /api/strings/:string_value
	// ==========================================
	describe("GET /api/strings/:string_value", () => {
		test("should retrieve an existing string", async () => {
			const response = await request(app)
				.get(`/api/strings/${testStrings.palindrome}`)
				.expect("Content-Type", /json/)
				.expect(200);

			expect(response.body).toHaveProperty("value", testStrings.palindrome);
			expect(response.body.properties).toHaveProperty("is_palindrome", true);
			expect(response.body.properties).toHaveProperty("length", 5);
		});

		test("should return 404 for non-existent string", async () => {
			await request(app).get("/api/strings/nonexistentstring123").expect(404);
		});

		test("should handle URL-encoded strings", async () => {
			const encodedValue = encodeURIComponent(testStrings.palindrome);
			const response = await request(app)
				.get(`/api/strings/${encodedValue}`)
				.expect(200);

			expect(response.body.value).toBe(testStrings.palindrome);
		});
	});

	// ==========================================
	// GET /api/strings - Get All Strings
	// ==========================================
	describe("GET /api/strings", () => {
		beforeAll(async () => {
			// Create additional test strings
			await request(app)
				.post("/api/strings")
				.send({ value: testStrings.notPalindrome });
			await request(app)
				.post("/api/strings")
				.send({ value: testStrings.multiWord });
		});

		test("should retrieve all strings", async () => {
			const response = await request(app)
				.get("/api/strings")
				.expect("Content-Type", /json/)
				.expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("count");
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.count).toBeGreaterThan(0);
		});

		test("should filter palindromes", async () => {
			const response = await request(app)
				.get("/api/strings?is_palindrome=true")
				.expect(200);

			expect(
				response.body.data.every((s) => s.properties.is_palindrome === true)
			).toBe(true);
		});

		test("should filter by word count", async () => {
			const response = await request(app)
				.get("/api/strings?word_count=2")
				.expect(200);

			expect(
				response.body.data.every((s) => s.properties.word_count === 2)
			).toBe(true);
		});

		test("should filter by minimum length", async () => {
			const response = await request(app)
				.get("/api/strings?min_length=10")
				.expect(200);

			expect(response.body.data.every((s) => s.properties.length >= 10)).toBe(
				true
			);
		});

		test("should filter by maximum length", async () => {
			const response = await request(app)
				.get("/api/strings?max_length=5")
				.expect(200);

			expect(response.body.data.every((s) => s.properties.length <= 5)).toBe(
				true
			);
		});

		test("should reject invalid filter parameters", async () => {
			await request(app).get("/api/strings?is_palindrome=invalid").expect(400);
		});
	});

	// ==========================================
	// GET /api/strings/filter-by-natural-language
	// ==========================================
	describe("GET /api/strings/filter-by-natural-language", () => {
		test('should parse "palindrome" query', async () => {
			const response = await request(app)
				.get("/api/strings/filter-by-natural-language?query=palindrome")
				.expect(200);

			expect(response.body).toHaveProperty("interpreted_query");
			expect(response.body.interpreted_query.parsed_filters).toHaveProperty(
				"is_palindrome",
				"true"
			);
		});

		test('should parse "palindromic strings" query', async () => {
			const response = await request(app)
				.get(
					"/api/strings/filter-by-natural-language?query=palindromic strings"
				)
				.expect(200);

			expect(response.body.interpreted_query.parsed_filters).toHaveProperty(
				"is_palindrome",
				"true"
			);
		});

		test('should parse "single word" query', async () => {
			const response = await request(app)
				.get("/api/strings/filter-by-natural-language?query=single word")
				.expect(200);

			expect(response.body.interpreted_query.parsed_filters).toHaveProperty(
				"word_count",
				"1"
			);
		});

		test("should reject missing query parameter", async () => {
			await request(app)
				.get("/api/strings/filter-by-natural-language")
				.expect(400);
		});

		test("should reject empty query", async () => {
			await request(app)
				.get("/api/strings/filter-by-natural-language?query=")
				.expect(400);
		});
	});

	// ==========================================
	// GET /api/strings/stats/statistics
	// ==========================================
	describe("GET /api/strings/stats/statistics", () => {
		test("should return statistics", async () => {
			const response = await request(app)
				.get("/api/strings/stats/statistics")
				.expect("Content-Type", /json/)
				.expect(200);

			expect(response.body).toHaveProperty("statistics");
			expect(response.body.statistics).toHaveProperty("total_strings");
			expect(response.body.statistics).toHaveProperty("avg_length");
			expect(response.body.statistics).toHaveProperty("max_length");
			expect(response.body.statistics).toHaveProperty("min_length");
			expect(response.body).toHaveProperty("generated_at");
		});

		test("statistics should have valid numeric values", async () => {
			const response = await request(app)
				.get("/api/strings/stats/statistics")
				.expect(200);

			const stats = response.body.statistics;
			expect(typeof stats.total_strings).toBe("number");
			expect(stats.total_strings).toBeGreaterThanOrEqual(0);
		});
	});

	// ==========================================
	// DELETE /api/strings/:string_value
	// ==========================================
	describe("DELETE /api/strings/:string_value", () => {
		test("should delete an existing string", async () => {
			// Create a string to delete
			await request(app).post("/api/strings").send({ value: "deleteMe" });

			// Delete it
			await request(app).delete("/api/strings/deleteMe").expect(204);

			// Verify it's gone
			await request(app).get("/api/strings/deleteMe").expect(404);
		});

		test("should return 404 when deleting non-existent string", async () => {
			await request(app).delete("/api/strings/doesnotexist123").expect(404);
		});
	});

	// ==========================================
	// Error Handling
	// ==========================================
	describe("Error Handling", () => {
		test("should return 404 for invalid endpoint", async () => {
			await request(app).get("/api/invalid-endpoint").expect(404);
		});

		test("should handle malformed JSON", async () => {
			await request(app)
				.post("/api/strings")
				.set("Content-Type", "application/json")
				.send('{"value": invalid}')
				.expect(400);
		});
	});
});
