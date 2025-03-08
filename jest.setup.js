import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: jest.fn() } } 
      }),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    rpc: jest.fn(),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        list: jest.fn(),
        remove: jest.fn(),
      }),
    },
  },
}));

// Mock OpenAI
jest.mock('openai', () => {
  const OpenAIMock = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    embeddings: {
      create: jest.fn(),
    },
  };
  return { OpenAI: jest.fn(() => OpenAIMock) };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date, format) => '01 Jan 2024'),
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  LineChart: ({ children }) => children,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// MSW Server Setup
export const server = setupServer(
  // Chat API mocks
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Mocked response',
      })
    );
  }),

  // Analytics API mocks
  rest.get('/api/analytics/overview', (req, res, ctx) => {
    return res(
      ctx.json({
        totalMessages: 1000,
        totalSessions: 100,
        totalUsers: 50,
        avgResponseTime: 1500,
      })
    );
  }),

  // Chatbot API mocks
  rest.get('/api/chatbots/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        name: 'Test Chatbot',
        description: 'A test chatbot',
        systemPrompt: 'You are a helpful assistant',
        welcomeMessage: 'Hello! How can I help?',
        temperature: 0.7,
        isActive: true,
      })
    );
  }),

  // Auth API mocks
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        user: {
          id: '123',
          email: 'test@example.com',
        },
        session: 'mock-session',
      })
    );
  })
);

// Start MSW Server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console errors during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: useLayoutEffect does nothing on the server'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});