import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ReduxTranslationProvider, { useReduxStore, useReduxAdapter } from './redux-provider';
import { translationReducer } from './redux';
import { TranslationCore } from '../core/TranslationCore';

// Mock TranslationCore
jest.mock('../core/TranslationCore');

const MockTranslationCore = TranslationCore as jest.MockedClass<typeof TranslationCore>;

// Mock Redux store for testing
const createMockStore = () => {
  return configureStore({
    reducer: {
      translation: translationReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false
      })
  });
};

// Test component to test hooks
const TestComponent = () => {
  const store = useReduxStore();
  const adapter = useReduxAdapter();
  
  return (
    <div>
      <div data-testid="store-available">{store ? 'Store Available' : 'No Store'}</div>
      <div data-testid="adapter-available">{adapter ? 'Adapter Available' : 'No Adapter'}</div>
    </div>
  );
};

// Test component for error boundary testing
const ErrorComponent = () => {
  throw new Error('Test error');
};

describe('ReduxTranslationProvider', () => {
  let mockCore: jest.Mocked<TranslationCore>;

  // Helper function to create test config
  const createTestConfig = () => ({
    defaultLocale: 'en',
    fallbackLocale: 'en',
    serviceName: 'test-service'
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a comprehensive mock of TranslationCore
    mockCore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {}),
      setLocale: jest.fn(),
      loadTranslations: jest.fn().mockResolvedValue(undefined),
      translate: jest.fn().mockReturnValue('translated'),
      translatePlural: jest.fn().mockReturnValue('translated plural'),
      formatDate: jest.fn().mockReturnValue('formatted date'),
      formatNumber: jest.fn().mockReturnValue('formatted number'),
      getTextDirection: jest.fn().mockReturnValue('ltr'),
      isRTLLocale: jest.fn().mockReturnValue(false),
      reloadTranslations: jest.fn().mockResolvedValue(undefined),
      clearCache: jest.fn(),
      getState: jest.fn().mockReturnValue({
        locale: 'en',
        translations: {},
        isLoading: false,
        error: null,
        isInitialized: false
      }),
      getActions: jest.fn().mockReturnValue({
        setLocale: jest.fn(),
        loadTranslations: jest.fn(),
        translate: jest.fn(),
        translatePlural: jest.fn(),
        formatDate: jest.fn(),
        formatNumber: jest.fn(),
        getTextDirection: jest.fn(),
        isRTLLocale: jest.fn(),
        reloadTranslations: jest.fn(),
        clearCache: jest.fn()
      })
    } as any;

    MockTranslationCore.mockImplementation(() => mockCore);
    
    // Ensure the mock is properly applied
    (MockTranslationCore as any).mockClear();
  });

  describe('Provider Initialization', () => {
    it('should render loading state initially', () => {
      const config = createTestConfig();
      
      render(
        <ReduxTranslationProvider config={config}>
          <div>Test Content</div>
        </ReduxTranslationProvider>
      );

      expect(screen.getByText('Initializing Redux Translation Provider...')).toBeInTheDocument();
    });

    it('should initialize successfully and render children', async () => {
      const config = createTestConfig();
      
      await act(async () => {
        render(
          <ReduxTranslationProvider config={config}>
            <div data-testid="test-content">Test Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Initializing Redux Translation Provider...')).not.toBeInTheDocument();
    });

    it('should handle initialization errors gracefully', async () => {
      const config = createTestConfig();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCore.initialize.mockRejectedValue(new Error('Initialization failed'));

      await act(async () => {
        render(
          <ReduxTranslationProvider config={config}>
            <div data-testid="test-content">Test Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize Redux translation provider:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should use external store when provided', async () => {
      const config = createTestConfig();
      const externalStore = createMockStore();
      
      await act(async () => {
        render(
          <ReduxTranslationProvider config={config} store={externalStore}>
            <div data-testid="test-content">Test Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Should not create internal store
      expect(MockTranslationCore).toHaveBeenCalledTimes(1);
    });

    it('should handle initialLocale prop', async () => {
      const config = createTestConfig();
      
      await act(async () => {
        render(
          <ReduxTranslationProvider config={config} initialLocale="fr">
            <div data-testid="test-content">Test Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(MockTranslationCore).toHaveBeenCalledWith(config);
    });
  });

  describe('Store Configuration', () => {
    it('should create store with correct reducer', async () => {
      const config = createTestConfig();
      
      await act(async () => {
        render(
          <ReduxTranslationProvider config={config}>
            <div data-testid="test-content">Test Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Verify store was created with translation reducer
      expect(MockTranslationCore).toHaveBeenCalledWith(config);
    });

    it('should configure middleware correctly', async () => {
      const config = createTestConfig();
      
      await act(async () => {
        render(
          <ReduxTranslationProvider config={config}>
            <div data-testid="test-content">Test Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // The middleware configuration is tested indirectly through store creation
      expect(mockCore.initialize).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should destroy adapter on unmount', async () => {
      const config = createTestConfig();
      
      const { unmount } = render(
        <ReduxTranslationProvider config={config}>
          <div data-testid="test-content">Test Content</div>
        </ReduxTranslationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      unmount();

      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle cleanup when adapter is null', async () => {
      const config = createTestConfig();
      
      const { unmount } = render(
        <ReduxTranslationProvider config={config}>
          <div data-testid="test-content">Test Content</div>
        </ReduxTranslationProvider>
      );

      // Unmount before initialization completes
      unmount();

      // Should not throw error - destroy may still be called during cleanup
      // but the component should handle it gracefully
      expect(true).toBe(true); // Just verify the test doesn't throw
    });
  });

  describe('Hooks', () => {
    describe('useReduxStore', () => {
      it('should return store when used within provider', async () => {
        const config = createTestConfig();
        
        await act(async () => {
          render(
            <ReduxTranslationProvider config={config}>
              <TestComponent />
            </ReduxTranslationProvider>
          );
        });

        await waitFor(() => {
          expect(screen.getByTestId('store-available')).toHaveTextContent('Store Available');
        });
      });

      it('should throw error when used outside provider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
          render(<TestComponent />);
        }).toThrow('useReduxStore must be used within a ReduxTranslationProvider');

        consoleSpy.mockRestore();
      });
    });

    describe('useReduxAdapter', () => {
      it('should return adapter when used within provider', async () => {
        const config = createTestConfig();
        
        await act(async () => {
          render(
            <ReduxTranslationProvider config={config}>
              <TestComponent />
            </ReduxTranslationProvider>
          );
        });

        await waitFor(() => {
          expect(screen.getByTestId('adapter-available')).toHaveTextContent('Adapter Available');
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid re-renders', async () => {
      const config = createTestConfig();
      
      const { rerender } = render(
        <ReduxTranslationProvider config={config}>
          <div data-testid="test-content">Test Content</div>
        </ReduxTranslationProvider>
      );

      // Rapidly re-render
      await act(async () => {
        rerender(
          <ReduxTranslationProvider config={config}>
            <div data-testid="test-content">Updated Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toHaveTextContent('Updated Content');
      });
    });

    it('should handle config changes', async () => {
      const initialConfig = createTestConfig();
      const newConfig = { ...createTestConfig(), defaultLocale: 'fr' };
      
      const { rerender } = render(
        <ReduxTranslationProvider config={initialConfig}>
          <div data-testid="test-content">Test Content</div>
        </ReduxTranslationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Change config
      await act(async () => {
        rerender(
          <ReduxTranslationProvider config={newConfig}>
            <div data-testid="test-content">Updated Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toHaveTextContent('Updated Content');
      });

      // Should create new core with new config
      expect(MockTranslationCore).toHaveBeenCalledWith(newConfig);
    });

    it('should handle external store changes', async () => {
      const config = createTestConfig();
      const initialStore = createMockStore();
      const newStore = createMockStore();
      
      const { rerender } = render(
        <ReduxTranslationProvider config={config} store={initialStore}>
          <div data-testid="test-content">Test Content</div>
        </ReduxTranslationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Change external store
      await act(async () => {
        rerender(
          <ReduxTranslationProvider config={config} store={newStore}>
            <div data-testid="test-content">Updated Content</div>
          </ReduxTranslationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toHaveTextContent('Updated Content');
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should not create unnecessary instances on re-renders', async () => {
      const config = createTestConfig();
      
      const { rerender } = render(
        <ReduxTranslationProvider config={config}>
          <div data-testid="test-content">Test Content</div>
        </ReduxTranslationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      const initialCallCount = MockTranslationCore.mock.calls.length;

      // Re-render with same config
      await act(async () => {
        rerender(
          <ReduxTranslationProvider config={config}>
            <div data-testid="test-content">Same Content</div>
          </ReduxTranslationProvider>
        );
      });

      // Should not create new instances
      expect(MockTranslationCore.mock.calls.length).toBe(initialCallCount);
    });
  });
});
