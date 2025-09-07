# SingleSiteScraper

A powerful React-based web scraping application that extracts structured data from websites with analytics capabilities.

## Features

- Web scraping with customizable options
- Analytics dashboard with performance metrics
- Schema.org data extraction and validation
- Interactive visualizations (word clouds, network graphs, database schemas)
- Export functionality (GraphML, JSON, CSV)
- Comprehensive test coverage

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/aledlie/SingleSiteScraper.git
cd SingleSiteScraper
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

## Testing

This project uses Vitest for testing with comprehensive coverage across all components and utilities.

### Test Structure

All test files are organized in the `tests/` directory, mirroring the source structure:

```
tests/
├── run_tests.sh              # Test runner script
└── src/
    ├── test-setup.ts          # Test configuration and mocks
    ├── components/            # Component tests
    ├── scraper/              # Scraper logic tests
    ├── utils/                # Utility function tests
    ├── analytics/            # Analytics engine tests
    ├── visualizations/       # Visualization component tests
    └── integration/          # End-to-end integration tests
```

### Running Tests

**Quick Start:**
```bash
bash tests/run_tests.sh
```

**Available Test Commands:**
```bash
# Run all tests
npm run test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- tests/src/scraper/scrapeWebsite.test.ts

# Run tests matching a pattern
npm run test -- --grep "analytics"
```

**Test Categories:**
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: End-to-end workflow validation
- **Schema Tests**: Schema.org compliance verification
- **Performance Tests**: Analytics and performance monitoring
- **UI Tests**: React component rendering and interaction

### Test Coverage

The test suite covers:
- Web scraping functionality and error handling
- Analytics dashboard components
- Data visualization components
- Schema.org data extraction and validation
- Performance monitoring and alerts
- Database integration (SQLMagic)
- Export functionality
- Error resilience and edge cases

## Project Structure

```
./
├── src/                      # Source code
│   ├── components/          # React components
│   ├── scraper/            # Web scraping logic
│   ├── analytics/          # Analytics engine
│   ├── visualizations/     # Data visualization components
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── tests/                   # Test files (mirrors src structure)
├── vitest.config.ts        # Test configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage

### Architecture

The application follows a modular architecture:

1. **Scraping Engine** (`src/scraper/`) - Core web scraping functionality
2. **Analytics System** (`src/analytics/`) - Performance monitoring and insights
3. **Visualization Layer** (`src/visualizations/`) - Interactive data visualizations
4. **Component Library** (`src/components/`) - Reusable UI components
5. **Utilities** (`src/utils/`) - Helper functions and data processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `bash tests/run_tests.sh` to ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.