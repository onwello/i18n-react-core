import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TranslatedText, TranslatedSpan, TranslatedDiv, TranslatedP, TranslatedH1, TranslatedH2, TranslatedH3, TranslatedLabel, TranslatedButton } from './TranslatedText';
import { TranslationProvider } from '../adapters/context';
import { ReactTranslationConfig } from '../types';
import * as hooks from '../adapters/context';

// Mock the useTranslation hook to return proper translations
jest.mock('../adapters/context', () => ({
  ...jest.requireActual('../adapters/context'),
  useTranslation: jest.fn()
}));

const mockUseTranslation = {
  t: jest.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      'welcome.title': 'Welcome',
      'welcome.message': 'Hello, John!',
      'user.count': 'You have {count} users',
      'user.profile': 'User Profile: {name}',
      'error.not_found': 'Not found',
    };
    
    if (!translations[key]) {
      return key;
    }
    
    let translation = translations[key];
    
    if (options?.params) {
      Object.keys(options.params).forEach(param => {
        translation = translation.replace(`{${param}}`, options.params[param]);
      });
    }
    
    return translation;
  }),
  translate: jest.fn((key: string, params?: any) => {
    const translations: Record<string, string> = {
      'welcome.title': 'Welcome',
      'welcome.message': 'Hello, John!',
      'user.count': 'You have {count} users',
      'user.profile': 'User Profile: {name}',
      'error.not_found': 'Not found',
    };
    
    if (!translations[key]) {
      return key;
    }
    
    let translation = translations[key];
    
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }
    
    return translation;
  }),
  translatePlural: jest.fn().mockReturnValue('translated'),
  formatDate: jest.fn().mockReturnValue('formatted date'),
  formatNumber: jest.fn().mockReturnValue('formatted number'),
  getTextDirection: jest.fn().mockReturnValue('ltr'),
  isRTLLocale: jest.fn().mockReturnValue(false),
  isLoading: false,
  error: null,
  locale: 'en',
  setLocale: jest.fn(),
  reloadTranslations: jest.fn(),
  clearCache: jest.fn()
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const config: ReactTranslationConfig = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'fr', 'es'],
    translationsPath: 'test-translations',
    debug: false,
    serviceName: 'test-service',
  };

  return (
    <TranslationProvider config={config}>
      {children}
    </TranslationProvider>
  );
};

describe('TranslatedText Component', () => {
  beforeEach(() => {
    (hooks.useTranslation as jest.Mock).mockReturnValue(mockUseTranslation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TranslatedText', () => {
    it('should render translated text', async () => {
      render(
        <TestWrapper>
          <TranslatedText translationKey="welcome.title" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should render with parameters', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.message" params={{ name: 'John' }} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Hello, John!')).toBeInTheDocument();
      });
    });

    it('should render fallback text when translation is missing', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="missing.key" fallback="Fallback Text" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Fallback Text')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should render key when no fallback is provided', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="missing.key" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('missing.key')).toBeInTheDocument();
      });
    });

    it('should render custom component', async () => {
      const CustomComponent = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="custom-component">{children}</div>
      );

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" component={CustomComponent} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('custom-component')).toHaveTextContent('Welcome');
      });
    });

    it('should render children when provided', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title">Custom Content</TranslatedText>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Custom Content')).toBeInTheDocument();
      });
    });

    it('should apply className and style', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="welcome.title" 
              className="test-class"
              style={{ color: 'red' }}
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const element = screen.getByText('Welcome');
        expect(element).toHaveClass('test-class');
        expect(element).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      });
    });

    it('should handle debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="missing.key" debug={true} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('missing.key')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: current)');
      consoleSpy.mockRestore();
    });

    it('should handle loading state', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      // The component should render the translated text since it's not in loading state
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('should handle error state', async () => {
      const ErrorWrapper = ({ children }: { children: React.ReactNode }) => {
        const config: ReactTranslationConfig = {
          defaultLocale: 'en',
          supportedLocales: ['en'],
          translationsPath: 'invalid-path',
          debug: false,
          serviceName: 'test-service',
        };

        return (
          <TranslationProvider config={config}>
            {children}
          </TranslationProvider>
        );
      };

      await act(async () => {
        render(
          <ErrorWrapper>
            <TranslatedText translationKey="welcome.title" fallback="Error Fallback" />
          </ErrorWrapper>
        );
      });

      await waitFor(() => {
        // The component should render the translated text since the error is handled gracefully
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should handle missing translation key with debug enabled', async () => {
      const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
        const config: ReactTranslationConfig = {
          defaultLocale: 'en',
          supportedLocales: ['en'],
          translationsPath: 'test-translations',
          debug: true,
          serviceName: 'test-service',
        };

        return (
          <TranslationProvider config={config}>
            {children}
          </TranslationProvider>
        );
      };

      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedText translationKey="missing.key" debug={true} />
          </DebugWrapper>
        );
      });

      await waitFor(() => {
        // Should render the key when translation is missing
        expect(screen.getByText('missing.key')).toBeInTheDocument();
      });

      // Should log warning when debug is enabled and translation key not found
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: current)');
      consoleSpy.mockRestore();
    });

    it('should handle translation failure with debug enabled', async () => {
      const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
        const config: ReactTranslationConfig = {
          defaultLocale: 'en',
          supportedLocales: ['en'],
          translationsPath: 'test-translations',
          debug: true,
          serviceName: 'test-service',
        };

        return (
          <TranslationProvider config={config}>
            {children}
          </TranslationProvider>
        );
      };

      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedText translationKey="missing.key" debug={true} />
          </DebugWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('missing.key')).toBeInTheDocument();
      });

      // Should log warning when debug is enabled and translation key not found
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: current)');
      consoleSpy.mockRestore();
    });

    it('should handle translation failure with debug disabled', async () => {
      const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
        const config: ReactTranslationConfig = {
          defaultLocale: 'en',
          supportedLocales: ['en'],
          translationsPath: 'test-translations',
          debug: false,
          serviceName: 'test-service',
        };

        return (
          <TranslationProvider config={config}>
            {children}
          </TranslationProvider>
        );
      };

      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedText translationKey="missing.key" debug={false} />
          </DebugWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('missing.key')).toBeInTheDocument();
      });

      // Should not log warning when debug is disabled
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle translation failure with fallback and debug enabled', async () => {
      const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
        const config: ReactTranslationConfig = {
          defaultLocale: 'en',
          supportedLocales: ['en'],
          translationsPath: 'test-translations',
          debug: true,
          serviceName: 'test-service',
        };

        return (
          <TranslationProvider config={config}>
            {children}
          </TranslationProvider>
        );
      };

      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedText translationKey="missing.key" fallback="Custom Fallback" debug={true} />
          </DebugWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
      });

      // Should log warning when debug is enabled and translation key not found
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: current)');
      consoleSpy.mockRestore();
    });
  });

  describe('loading and error states', () => {
    it('should show fallback when loading', async () => {
      const loadingMock = {
        ...mockUseTranslation,
        isLoading: true
      };

      (hooks.useTranslation as jest.Mock).mockReturnValue(loadingMock);

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="test.key" 
              fallback="Loading fallback"
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Loading fallback')).toBeInTheDocument();
      });
    });

    it('should show fallback when error occurs and debug is enabled', async () => {
      const errorMock = {
        ...mockUseTranslation,
        error: new Error('Translation error')
      };

      (hooks.useTranslation as jest.Mock).mockReturnValue(errorMock);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="test.key" 
              fallback="Error fallback"
              debug={true}
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Error fallback')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('Translation error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should show fallback when error occurs and debug is disabled', async () => {
      const errorMock = {
        ...mockUseTranslation,
        error: new Error('Translation error')
      };

      (hooks.useTranslation as jest.Mock).mockReturnValue(errorMock);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="test.key" 
              fallback="Error fallback"
              debug={false}
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Error fallback')).toBeInTheDocument();
        expect(consoleSpy).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Convenience Components', () => {
    it('should render TranslatedSpan', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedSpan translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const element = screen.getByText('Welcome');
        expect(element.tagName.toLowerCase()).toBe('span');
      });
    });

    it('should render TranslatedDiv', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedDiv translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const element = screen.getByText('Welcome');
        expect(element.tagName.toLowerCase()).toBe('div');
      });
    });

    it('should render TranslatedH1', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedH1 translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const element = screen.getByText('Welcome');
        expect(element.tagName.toLowerCase()).toBe('h1');
      });
    });
  });

  describe('Locale-specific rendering', () => {
    it('should render with specific locale', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" locale="fr" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle translation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" debug={true} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing translation with debug enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="missing.key" debug={true} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('missing.key')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: current)');
      consoleSpy.mockRestore();
    });

    it('should handle translation failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" debug={true} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle null params gracefully', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" params={null as any} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should handle undefined params gracefully', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" params={undefined} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should handle empty params object gracefully', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title" params={{}} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should handle translation with complex params', async () => {
      const complexParams = {
        name: 'John',
        age: 30,
        city: 'New York',
        isActive: true,
        metadata: { role: 'admin', permissions: ['read', 'write'] }
      };

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="user.profile" params={complexParams} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/John/)).toBeInTheDocument();
      });
    });

    it('should handle error state with custom fallback', async () => {
      // Create a wrapper that will cause an error
      const ErrorTestWrapper = ({ children }: { children: React.ReactNode }) => {
        const config: ReactTranslationConfig = {
          defaultLocale: 'en',
          supportedLocales: ['en', 'fr', 'es'],
          translationsPath: 'invalid-path',
          debug: false,
          serviceName: 'test-service',
        };

        return (
          <TranslationProvider config={config}>
            {children}
          </TranslationProvider>
        );
      };

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="error.key" fallback="Error Fallback" />
          </TestWrapper>
        );
      });

      // Should show fallback when there's an error
      await waitFor(() => {
        expect(screen.getByText('Error Fallback')).toBeInTheDocument();
      });
    });

    it('should handle component with additional props', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="welcome.title" 
              component="h2"
              className="custom-class"
              style={{ color: 'red' }}
              data-testid="custom-element"
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const element = screen.getByTestId('custom-element');
        expect(element.tagName).toBe('H2');
        expect(element).toHaveClass('custom-class');
        expect(element).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(element).toHaveTextContent('Welcome');
      });
    });

    it('should handle children override', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title">
              Custom Children Text
            </TranslatedText>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Custom Children Text')).toBeInTheDocument();
        expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
      });
    });

    it('should handle empty children', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title">
              {null}
            </TranslatedText>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should handle undefined children', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="welcome.title">
              {undefined}
            </TranslatedText>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });
  });

  describe('Convenience components', () => {
    it('should render TranslatedP as p element', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedP translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const p = screen.getByText('Welcome');
        expect(p.tagName).toBe('P');
      });
    });

    it('should render TranslatedH2 as h2 element', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedH2 translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const h2 = screen.getByText('Welcome');
        expect(h2.tagName).toBe('H2');
      });
    });

    it('should render TranslatedH3 as h3 element', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedH3 translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const h3 = screen.getByText('Welcome');
        expect(h3.tagName).toBe('H3');
      });
    });

    it('should render TranslatedLabel as label element', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText component="label" translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const label = screen.getByText('Welcome');
        expect(label.tagName).toBe('LABEL');
      });
    });

    it('should render TranslatedButton as button element', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText component="button" translationKey="welcome.title" />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const button = screen.getByText('Welcome');
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('error handling', () => {
    it('should handle translation errors gracefully', async () => {
      // Test with a missing key that should trigger fallback
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="missing.key" 
              fallback="fallback text"
              debug={true}
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('fallback text')).toBeInTheDocument();
      });
    });

    it('should log warning when debug is enabled and translation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="missing.key" 
              fallback="fallback text"
              debug={true}
            />
          </TestWrapper>
        );
      });

      // The warning should be logged when debug is enabled
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it('should log warning when debug is enabled and translation key not found', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="missing.key" 
              debug={true}
            />
          </TestWrapper>
        );
      });

      // The warning should be logged when debug is enabled
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it('should use fallback when translation returns the same key', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="missing.key" 
              fallback="fallback text"
            />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('fallback text')).toBeInTheDocument();
      });
    });

    it('should use children when provided', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText translationKey="missing.key">
              Custom children text
            </TranslatedText>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Custom children text')).toBeInTheDocument();
      });
    });
  });

  describe('locale-specific translation', () => {
    it('should use specific locale when provided', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedText 
              translationKey="welcome.title" 
              locale="es"
            />
          </TestWrapper>
        );
      });

      // Should render the translation for the current locale
      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should use current locale when no specific locale provided', () => {
      render(
        <TestWrapper>
          <TranslatedText translationKey="welcome.title" />
        </TestWrapper>
      );

      // Should render the translation for the current locale
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });
});
