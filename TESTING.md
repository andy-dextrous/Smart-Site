# Testing Strategy for Smart Site

## Test-Driven Development Overview

**TDD follows the "Red-Green-Refactor" cycle:**
1. **Red**: Write a failing test that defines desired functionality
2. **Green**: Write minimal code to make the test pass  
3. **Refactor**: Improve code while keeping tests passing

For Smart Site, TDD is particularly valuable given the complex CMS architecture, AI integrations, and dynamic content management system.

## Current Testing Status

The codebase currently has **no testing infrastructure** - no test files, testing frameworks, or test scripts in package.json. This presents an opportunity to establish a comprehensive testing strategy from the ground up.

## Testing Framework Stack (Optimized for Your Tech Stack)

**Primary Frameworks:**
- **Jest + @next/jest**: Optimized for Next.js 15 + Turbopack + React 19
- **Testing Library**: Component testing (@testing-library/react latest for React 19)
- **Playwright**: End-to-end testing for admin workflows
- **MSW**: API mocking for isolated tests

**Smart Site Specific:**
- **Payload Test Suite**: Built-in Jest utilities for CMS operations
- **Custom Path Mapping**: Jest moduleNameMapper for your TypeScript paths
- **Tailwind v4 Support**: CSS-first testing configuration
- **pnpm Integration**: All commands optimized for pnpm workspace

## Testing Strategy by Layer

### 1. Core CMS Functionality Tests

**Collection Operations:**
- CRUD operations for pages, posts, services, team members, testimonials
- Field validation (rich text, image uploads, form fields)
- Relationship management (cross-collection relationships, polymorphic fields)
- Status transitions (draft → published → archived)

**URI Routing Engine Tests:**
```typescript
// Example test structure
describe('URI Routing Engine', () => {
  test('generates homepage URI correctly', async () => {
    const uri = await routingEngine.generateURI({
      collection: 'pages',
      slug: 'home'
    })
    expect(uri).toBe('/')
  })

  test('handles hierarchical page relationships', async () => {
    const uri = await routingEngine.generateURI({
      collection: 'pages', 
      slug: 'team',
      data: { parent: 'about-us-page-id' }
    })
    expect(uri).toBe('/about-us/team')
  })

  test('updates all descendant URIs when parent changes', async () => {
    // Test dependency cascade functionality
  })
})
```

**Template System:**
- Template application logic
- Template field inheritance
- Template-specific rendering rules

### 2. Admin Interface Tests

**Dashboard Components:**
- Navigation sidebar functionality
- User management interfaces
- Content editing workflows
- Media library operations

**Content Management:**
- Section builder interface
- Block editing and reordering
- Live preview functionality
- Draft/publish workflows

**Authentication/Authorization:**
- User roles and permissions
- Access control for different content types
- Session management

### 3. Frontend Rendering Tests

**Section Components:**
```typescript
// Example section component test
describe('Hero Section Component', () => {
  test('renders hero content from CMS data', () => {
    const heroData = {
      heading: 'Welcome to Our Site',
      content: 'This is our hero message',
      buttons: [{ label: 'Get Started', link: '/contact' }]
    }
    
    render(<HeroSection {...heroData} />)
    
    expect(screen.getByRole('heading')).toHaveTextContent('Welcome to Our Site')
    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/contact')
  })
})
```

**Dynamic Content Tests:**
- Page rendering from CMS data
- Section composition and ordering
- Responsive layout behavior
- SEO meta generation

**Component Integration:**
- Footer/header rendering with global data
- Navigation menu generation
- Breadcrumb functionality

### 4. AI Integration Tests

**Mastra Workflows:**
- AI dashboard operations
- Content generation workflows
- Error handling for AI API failures
- Rate limiting and retry logic

**Chat Interface:**
- Assistant UI functionality
- Message handling and display
- Context management
- Streaming responses

**Content Processing:**
- AI-generated meta descriptions
- SEO optimization suggestions
- Content analysis and scoring

### 5. API Endpoint Tests

**Payload API:**
- GraphQL query execution
- REST endpoint responses
- Authentication middleware
- Error handling and validation

**Custom Routes:**
```typescript
// Example API test
describe('/api/seed endpoint', () => {
  test('seeds database with initial data', async () => {
    const response = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    expect(response.status).toBe(200)
    
    // Verify seeded data exists
    const pages = await payload.find({ collection: 'pages' })
    expect(pages.docs).toHaveLength(5)
  })
})
```

**Form Submissions:**
- Contact form processing
- Newsletter signup handling
- Form validation and error messages

## Implementation Roadmap

### Phase 1: Foundation Setup (Week 1)
1. **Install Testing Dependencies (Optimized for Your Stack)**
   ```bash
   # Core testing framework optimized for Next.js 15 + React 19
   pnpm add -D jest jest-environment-jsdom @next/jest
   pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
   
   # E2E and API mocking
   pnpm add -D playwright @playwright/test
   pnpm add -D msw
   
   # Payload CMS testing utilities
   pnpm add -D @payloadcms/testing-helpers
   ```

2. **Configure Test Environment (Smart Site Specific)**
   - Create jest.config.js with Next.js 15 + custom path mappings
   - Set up Payload test database configuration
   - Configure MSW for API mocking with your custom routes
   - Configure Tailwind v4 CSS-first testing
   - Add test scripts to package.json with pnpm

3. **Create Test Utilities (Smart Site Architecture)**
   - Payload test helpers with your custom collections
   - Component render utilities with admin/frontend separation
   - Data factory functions for your collections (pages, posts, services, team)
   - Mock data generators matching your seed data structure
   - URI routing engine test utilities

### Phase 2: Core CMS Tests (Week 2-3)
4. **URI Routing Engine Tests**
   - Homepage generation
   - Hierarchical page URIs
   - Collection item URIs with archives
   - Dependency cascade operations
   - Conflict detection and resolution

5. **Collection Operation Tests**
   - CRUD operations for all collections
   - Field validation for rich text, uploads, relationships
   - Status transitions and hooks
   - Search and filtering functionality

6. **Template System Tests**
   - Template application logic
   - Field inheritance patterns
   - Template-specific rendering

### Phase 3: Interface & Integration Tests (Week 4-5)
7. **Admin Dashboard Tests**
   - Navigation and sidebar functionality
   - Content management workflows
   - User management interfaces
   - Media library operations

8. **Frontend Component Tests**
   - All section components with CMS integration
   - Layout components (header, footer, navigation)
   - Form components and validation
   - Responsive behavior testing

9. **API Endpoint Tests**
   - Custom route functionality
   - Form submission processing
   - Authentication and authorization
   - Error handling and validation

### Phase 4: AI & Advanced Features (Week 6)
10. **Mastra Integration Tests**
    - AI workflow execution
    - Chat interface functionality
    - Content generation and processing
    - Error handling and fallbacks

11. **End-to-End Tests**
    - Complete user journeys with Playwright
    - Admin content creation workflows
    - Frontend user interactions
    - Cross-browser compatibility

### Phase 5: CI/CD Integration (Week 7)
12. **GitHub Actions Setup**
    - Automated test execution on PR
    - Test database provisioning
    - Coverage reporting
    - Performance benchmarking

13. **Advanced Testing Features**
    - Visual regression testing
    - Load testing for dynamic content
    - Security testing for auth flows
    - Accessibility testing

## Smart Site Specific Test Scenarios

### URI Engine Edge Cases
- Homepage designation changes
- Archive page slug modifications
- Complex hierarchy restructuring
- URI conflict resolution
- Redirect management

### CMS Workflow Tests
- Draft → published transitions
- Template changes and propagation
- Media file handling and optimization
- Form builder configuration
- SEO field generation

### AI Integration Scenarios
- Content generation with various prompts
- Chat context management
- AI suggestion acceptance/rejection
- Fallback behavior when AI services fail
- Rate limiting and queue management

## Best Practices for TDD in Smart Site

### 1. Start with Business Logic Tests
Focus on core functionality like URI generation, content relationships, and data validation before UI components.

### 2. Use Realistic Test Data
Leverage your existing seed scripts to create consistent test data that mirrors production scenarios.

### 3. Test Integration Points
Pay special attention to testing the boundaries between:
- Frontend ↔ Payload API
- Admin dashboard ↔ Content management
- AI services ↔ Content processing

### 4. Mock External Dependencies
Use MSW to mock:
- AI service APIs (OpenAI, Mastra)
- External media services
- Email services (Resend)
- Database operations when needed

### 5. Maintain Test Database
- Use separate test database configuration
- Implement proper setup/teardown for test isolation
- Seed consistent test data for reliable testing

## Testing Commands (Optimized for pnpm + Your Stack)

Add to package.json scripts:
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

## Jest Configuration (jest.config.js)

```javascript
const nextJest = require('@next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Handle your custom TypeScript path mappings
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@payload-config$': '<rootDir>/src/admin/payload/payload.config.ts',
    '^@payload-types$': '<rootDir>/src/admin/payload/payload-types.ts',
    '^@smartsite-config$': '<rootDir>/src/smartsite.config.ts',
    '^@admin-lib/(.*)$': '<rootDir>/src/admin/lib/$1',
    '^@admin-components/(.*)$': '<rootDir>/src/admin/components/$1',
    '^@admin-utilities/(.*)$': '<rootDir>/src/admin/utilities/$1',
    '^@payload-components/(.*)$': '<rootDir>/src/admin/payload/components/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/demos/'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/admin/payload/payload-types.ts', // Generated file
    '!src/**/index.ts', // Export files
  ],
  
  // Transform settings for your stack
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Setup for Payload CMS testing
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

## Jest Setup File (jest.setup.js)

```javascript
import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Payload CMS for unit tests
jest.mock('@payload-config', () => ({
  collections: [],
  globals: [],
}))
```

## Stack-Specific Considerations

### Next.js 15 + Turbopack Compatibility
- Jest configuration uses `@next/jest` for seamless Next.js 15 integration
- Custom webpack configurations in your `next.config.ts` are automatically handled
- Turbopack resolveExtensions and SVG handling work in test environment

### Payload CMS Integration
- Use `@payloadcms/testing-helpers` for database operations in tests
- Mock your custom collections (pages, posts, services, team, testimonials)
- Test your custom hooks and field configurations
- URI Index Collection testing requires special setup

### Tailwind v4 CSS-First Testing
- CSS utilities are available in JSDOM environment
- Test responsive classes and custom CSS variables
- Animation testing with GSAP requires additional setup

### React 19 Compatibility
- Latest Testing Library versions support React 19 features
- Server Components testing requires special configuration
- Concurrent features testing patterns

### pnpm Workspace Integration
- All commands optimized for pnpm instead of npm
- Workspace dependencies properly resolved in test environment
- Monorepo path resolution handled correctly

## Conclusion

This testing strategy is now **fully optimized for your Smart Site tech stack** including Next.js 15, React 19, Payload CMS, Tailwind v4, and pnpm workspace architecture. 

The configuration handles your custom TypeScript path mappings, admin/frontend separation, and complex CMS workflows while providing comprehensive coverage for your sophisticated URI routing system and AI integrations.

The phased approach allows for incremental implementation while immediately providing value through improved code quality and reduced bugs tailored specifically to your platform's unique architecture.