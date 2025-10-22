# String Analyzer API

A robust RESTful API service built with Node.js and Express that analyzes strings and stores their computed properties. The API provides comprehensive string analysis including length calculation, palindrome detection, unique character counting, word count, SHA-256 hashing, and character frequency mapping.

## 🚀 Features

- **String Analysis**: Comprehensive analysis of input strings with multiple computed properties
- **Database Storage**: Persistent storage using MySQL with optimized indexing
- **Advanced Filtering**: Query strings by various properties (palindrome, length, word count, etc.)
- **Natural Language Queries**: Human-readable query parsing (e.g., "palindromes", "single words")
- **Statistics Endpoint**: Get aggregated statistics about stored strings
- **Rate Limiting**: Built-in protection against abuse with configurable limits
- **Security**: Helmet.js integration with security headers and CORS support
- **Comprehensive Testing**: Full test coverage with Jest and Supertest
- **Docker Support**: Containerized deployment with Docker Compose
- **Error Handling**: Robust error handling with custom error classes

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MySQL 8.0+ with connection pooling
- **Security**: Helmet.js, CORS, Rate Limiting
- **Testing**: Jest, Supertest
- **Containerization**: Docker & Docker Compose
- **Development**: Nodemon for hot reloading

## 📁 Project Structure

```
string-analyzer-api/
├── src/
│   ├── config/
│   │   └── db.config.js          # Database configuration and connection
│   ├── controllers/
│   │   └── string.controllers.js # Request handlers and business logic
│   ├── database/
│   │   └── db.sql                # Database schema and setup
│   ├── middlewares/
│   │   ├── errorhandler.middlewares.js # Error handling utilities
│   │   └── validator.middlewares.js    # Input validation middleware
│   ├── models/
│   │   └── string.models.js      # Database operations and queries
│   └── routes/
│       └── string.routes.js      # API route definitions
├── tests/
│   └── string.test.js            # Comprehensive API tests
├── docker/
│   └── Dockerfile                # Docker container configuration
├── docs/                         # Documentation files
├── node_modules/                 # Dependencies
├── .env.example                  # Environment variables template
├── docker-compose.yml            # Docker Compose configuration
├── package.json                  # Project metadata and scripts
├── server.js                     # Application entry point
└── README.md                     # This file
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager
- Docker & Docker Compose (optional, for containerized deployment)

## 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dprince-03/String-Analyzer-API.git
   cd string-analyzer-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with the following variables:
   ```env
   # Server Configuration
   PORT=5080
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=string_analyzer_db
   DB_PORT=3306

   # Session Configuration (Optional)
   SESSION_SECRET=your_session_secret
   ```

4. **Database Setup:**
   - Create a MySQL database named `string_analyzer_db`
   - Run the database schema:
     ```bash
     mysql -u your_user -p string_analyzer_db < src/database/db.sql
     ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Starts the server with hot reloading using Nodemon.

### Production Mode
```bash
npm start
```
Starts the server in production mode.

The API will be available at `http://localhost:5080/api`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
docker-compose up -d
```

This will start both the API and MySQL database containers.

### Manual Docker Build
```bash
# Build the image
docker build -f docker/Dockerfile -t string-analyzer-api .

# Run the container
docker run -p 5080:5080 --env-file .env string-analyzer-api
```

## 📚 API Documentation

### Base URL
```
http://localhost:5080/api
```

### Authentication
Currently, no authentication is required. Rate limiting is applied to all `/api` routes.

---

### 1. Create/Analyze String
**POST** `/strings`

Analyzes a string and stores its properties in the database.

**Request Body:**
```json
{
  "value": "hello world"
}
```

**Response (201 Created):**
```json
{
  "id": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
  "value": "hello world",
  "properties": {
    "length": 11,
    "is_palindrome": false,
    "unique_characters": 8,
    "word_count": 2,
    "sha256_hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    "character_frequency_map": {
      "h": 1,
      "e": 1,
      "l": 3,
      "o": 2,
      " ": 1,
      "w": 1,
      "r": 1,
      "d": 1
    }
  },
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid input (empty string, wrong type, too long)
- `409`: String already exists

---

### 2. Get All Strings
**GET** `/strings`

Retrieves all stored strings with optional filtering.

**Query Parameters:**
- `is_palindrome` (boolean): Filter by palindrome status
- `min_length` (number): Minimum string length
- `max_length` (number): Maximum string length
- `word_count` (number): Exact word count
- `contains_character` (string): Single character that must be present

**Examples:**
```bash
# Get all palindromes
GET /api/strings?is_palindrome=true

# Get strings longer than 10 characters
GET /api/strings?min_length=10

# Get strings with exactly 2 words
GET /api/strings?word_count=2

# Get strings containing the letter 'a'
GET /api/strings?contains_character=a
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      "value": "hello world",
      "properties": {
        "length": 11,
        "is_palindrome": false,
        "unique_characters": 8,
        "word_count": 2,
        "sha256_hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
        "character_frequency_map": {
          "h": 1,
          "e": 1,
          "l": 3,
          "o": 2,
          " ": 1,
          "w": 1,
          "r": 1,
          "d": 1
        }
      },
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "filters_applied": {
    "word_count": "2"
  }
}
```

---

### 3. Get Specific String
**GET** `/strings/:string_value`

Retrieves a specific string by its value.

**URL Encoding:** Special characters in the string value should be URL-encoded.

**Example:**
```bash
GET /api/strings/hello%20world
```

**Response (200 OK):**
```json
{
  "id": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
  "value": "hello world",
  "properties": {
    "length": 11,
    "is_palindrome": false,
    "unique_characters": 8,
    "word_count": 2,
    "sha256_hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    "character_frequency_map": {
      "h": 1,
      "e": 1,
      "l": 3,
      "o": 2,
      " ": 1,
      "w": 1,
      "r": 1,
      "d": 1
    }
  },
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
- `404`: String not found

---

### 4. Natural Language Filtering
**GET** `/strings/filter-by-natural-language`

Filter strings using human-readable queries.

**Query Parameter:**
- `query` (string): Natural language description of desired strings

**Supported Queries:**
- "palindrome" or "palindromic"
- "single word", "two words", "three words", or "X words"
- "longer than X", "shorter than X"
- "at least X characters", "at most X characters"
- "between X and Y"
- "contains letter X" or "with letter X"

**Examples:**
```bash
GET /api/strings/filter-by-natural-language?query=palindrome
GET /api/strings/filter-by-natural-language?query=single%20word
GET /api/strings/filter-by-natural-language?query=longer%20than%2010
GET /api/strings/filter-by-natural-language?query=contains%20letter%20a
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
      "value": "madam",
      "properties": {
        "length": 5,
        "is_palindrome": true,
        "unique_characters": 3,
        "word_count": 1,
        "sha256_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
        "character_frequency_map": {
          "m": 2,
          "a": 2,
          "d": 1
        }
      },
      "created_at": "2024-01-15T10:25:00.000Z"
    }
  ],
  "count": 1,
  "interpreted_query": {
    "original": "palindrome",
    "parsed_filters": {
      "is_palindrome": "true"
    }
  }
}
```

---

### 5. Get Statistics
**GET** `/strings/stats/statistics`

Returns aggregated statistics about all stored strings.

**Response (200 OK):**
```json
{
  "statistics": {
    "total_strings": 150,
    "avg_length": 12.45,
    "max_length": 89,
    "min_length": 1,
    "palindrome_count": 23,
    "avg_word_count": 1.8,
    "last_analyzed": "2024-01-15T14:30:22.000Z"
  },
  "generated_at": "2024-01-15T14:35:10.000Z"
}
```

---

### 6. Delete String
**DELETE** `/strings/:string_value`

Deletes a specific string from the database.

**Example:**
```bash
DELETE /api/strings/hello%20world
```

**Response (204 No Content):**
- Success: Empty response body

**Error Response:**
- `404`: String not found

---

## 💡 Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:5080/api';

// Create a string
const createString = async (value) => {
  try {
    const response = await axios.post(`${API_BASE}/strings`, { value });
    console.log('Created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Get all palindromes
const getPalindromes = async () => {
  try {
    const response = await axios.get(`${API_BASE}/strings?is_palindrome=true`);
    console.log('Palindromes:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Natural language query
const queryNaturalLanguage = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/strings/filter-by-natural-language?query=single%20word`
    );
    console.log('Single words:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Python
```python
import requests

API_BASE = 'http://localhost:5080/api'

# Create a string
def create_string(value):
    try:
        response = requests.post(f'{API_BASE}/strings', json={'value': value})
        print('Created:', response.json())
    except requests.exceptions.RequestException as e:
        print('Error:', e)

# Get statistics
def get_statistics():
    try:
        response = requests.get(f'{API_BASE}/strings/stats/statistics')
        print('Statistics:', response.json())
    except requests.exceptions.RequestException as e:
        print('Error:', e)
```

### cURL
```bash
# Create a string
curl -X POST http://localhost:5080/api/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "hello world"}'

# Get all strings
curl http://localhost:5080/api/strings

# Get palindromes
curl "http://localhost:5080/api/strings?is_palindrome=true"

# Natural language query
curl "http://localhost:5080/api/strings/filter-by-natural-language?query=palindrome"

# Get statistics
curl http://localhost:5080/api/strings/stats/statistics

# Delete a string
curl -X DELETE "http://localhost:5080/api/strings/hello%20world"
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

The test suite includes:
- Unit tests for all API endpoints
- Error handling validation
- Database operations testing
- Input validation testing
- Integration tests with Supertest

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15-minute window per IP
- **Security Headers**: Helmet.js provides comprehensive security headers
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Comprehensive validation middleware
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Security headers and input sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Adejare Adedayo**
- GitHub: [@dprince-03](https://github.com/dprince-03)
- LinkedIn: [https://www.linkedin.com/in/adedayo-adejare/]

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- MySQL team for the reliable database
- Jest team for the testing framework
- Open source community for various dependencies

---
