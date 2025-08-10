import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { 
  TranslatedTextRN, 
  TranslatedText as TranslatedTextRNText, 
  TranslatedView, 
  TranslatedHeading, 
  TranslatedSubheading, 
  TranslatedBody, 
  TranslatedCaption 
} from './TranslatedTextRN';
import { TranslationProvider } from '../adapters/context';
import { ReactTranslationConfig } from '../types';
import * as hooks from '../adapters/context';

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const config: ReactTranslationConfig = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'fr', 'es'],
    translationsPath: 'test-translations',
    debug: {
      enabled: false,
      logMissingKeys: false
    },
    serviceName: 'test-service',
  };

  return (
    <TranslationProvider config={config}>
      {children}
    </TranslationProvider>
  );
};

const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
  const config: ReactTranslationConfig = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'fr', 'es'],
    translationsPath: 'test-translations',
    debug: {
      enabled: true,
      logMissingKeys: true
    },
    serviceName: 'test-service',
  };

  return (
    <TranslationProvider config={config}>
      {children}
    </TranslationProvider>
  );
};

describe('TranslatedTextRN Component', () => {
  describe('Component Exports', () => {
    it('should export all React Native components', () => {
      expect(TranslatedTextRN).toBeDefined();
      expect(TranslatedTextRNText).toBeDefined();
      expect(TranslatedView).toBeDefined();
      expect(TranslatedHeading).toBeDefined();
      expect(TranslatedSubheading).toBeDefined();
      expect(TranslatedBody).toBeDefined();
      expect(TranslatedCaption).toBeDefined();
    });

    it('should render TranslatedTextRN component', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN translationKey="welcome.title" />
          </TestWrapper>
        );
      });
      
      await waitFor(() => {
        const element = screen.getByTestId('text');
        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent('Welcome');
      });
    });

    it('should render convenience components', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRNText translationKey="welcome.title" />
            <TranslatedView translationKey="welcome.message" />
            <TranslatedHeading translationKey="user.count" />
            <TranslatedSubheading translationKey="user.profile" />
            <TranslatedBody translationKey="error.not_found" />
            <TranslatedCaption translationKey="welcome.title" />
          </TestWrapper>
        );
      });
      
      await waitFor(() => {
        // All components should render without crashing
        const textElements = screen.getAllByTestId('text');
        const viewElements = screen.getAllByTestId('view');
        expect(textElements.length).toBeGreaterThan(0);
        expect(viewElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle translationKey prop', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN translationKey="welcome.title" />
          </TestWrapper>
        );
      });
      
      await waitFor(() => {
        const element = screen.getByTestId('text');
        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent('Welcome');
      });
    });

    it('should handle style prop', async () => {
      const style = { color: 'red', fontSize: 16 };
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN translationKey="welcome.title" style={style} />
          </TestWrapper>
        );
      });
      
      await waitFor(() => {
        const element = screen.getByTestId('text');
        expect(element).toHaveAttribute('style');
      });
    });

    it('should handle debug prop', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedTextRN translationKey="missing.key" debug={true} />
          </DebugWrapper>
        );
      });
      
      await waitFor(() => {
        // Should log warning when debug is enabled and translation key not found
        expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: en)');
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle debug prop disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN translationKey="missing.key" debug={false} />
          </TestWrapper>
        );
      });
      
      await waitFor(() => {
        // Should not log warning when debug is disabled
        expect(consoleSpy).not.toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle fallback text when translation is missing', async () => {
      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedTextRN translationKey="missing.key" fallback="Custom Fallback" />
          </DebugWrapper>
        );
      });
      
      await waitFor(() => {
        const element = screen.getByTestId('text');
        expect(element).toHaveTextContent('Custom Fallback');
      });
    });

    it('should handle error state with debug enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedTextRN translationKey="missing.key" debug={true} />
          </DebugWrapper>
        );
      });
      
      await waitFor(() => {
        // Should log warning when debug is enabled
        expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: en)');
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle error state with debug disabled', async () => {
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

      // Mock console.error
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <ErrorWrapper>
            <TranslatedTextRN translationKey="welcome.title" fallback="Error Fallback" debug={false} />
          </ErrorWrapper>
        );
      });

      await waitFor(() => {
        // Should not log warning when debug is disabled
        expect(consoleSpy).not.toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle translation failure with debug enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedTextRN translationKey="missing.key" debug={true} />
          </DebugWrapper>
        );
      });

      await waitFor(() => {
        // Should log warning when debug is enabled and translation key not found
        expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key (locale: en)');
      });

      consoleSpy.mockRestore();
    });

    it('should handle translation failure with fallback and debug enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        render(
          <DebugWrapper>
            <TranslatedTextRN translationKey="missing.key" fallback="Custom Fallback" debug={true} />
          </DebugWrapper>
        );
      });

      await waitFor(() => {
        // Should render fallback text when translation is missing
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
        // Should not log warning when fallback is provided (user has handled the missing translation)
        expect(consoleSpy).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('loading and error states', () => {
    it('should show fallback when loading', async () => {
      const mockUseTranslation = {
        t: jest.fn().mockReturnValue('translated'),
        translate: jest.fn().mockReturnValue('translated'),
        translatePlural: jest.fn().mockReturnValue('translated'),
        formatDate: jest.fn().mockReturnValue('formatted date'),
        formatNumber: jest.fn().mockReturnValue('formatted number'),
        getTextDirection: jest.fn().mockReturnValue('ltr'),
        isRTLLocale: jest.fn().mockReturnValue(false),
        isLoading: true,
        error: null,
        locale: 'en',
        setLocale: jest.fn(),
        reloadTranslations: jest.fn(),
        clearCache: jest.fn()
      };

      jest.spyOn(hooks, 'useTranslation').mockReturnValue(mockUseTranslation);

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN 
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
      const mockUseTranslation = {
        t: jest.fn().mockReturnValue('translated'),
        translate: jest.fn().mockReturnValue('translated'),
        translatePlural: jest.fn().mockReturnValue('translated'),
        formatDate: jest.fn().mockReturnValue('formatted date'),
        formatNumber: jest.fn().mockReturnValue('formatted number'),
        getTextDirection: jest.fn().mockReturnValue('ltr'),
        isRTLLocale: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: new Error('Translation error'),
        locale: 'en',
        setLocale: jest.fn(),
        reloadTranslations: jest.fn(),
        clearCache: jest.fn()
      };

      jest.spyOn(hooks, 'useTranslation').mockReturnValue(mockUseTranslation);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN 
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
  });

  describe('Error Handling', () => {
    it('should handle missing translations gracefully', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TranslatedTextRN translationKey="missing.key" fallback="Fallback Text" />
          </TestWrapper>
        );
      });
      
      await waitFor(() => {
        // Component should render without crashing
        expect(screen.getByTestId('text')).toBeInTheDocument();
      });
    });

    it('should handle translation service errors', async () => {
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
            <TranslatedTextRN translationKey="welcome.title" />
          </ErrorWrapper>
        );
      });
      
      await waitFor(() => {
        // Component should render without crashing even with errors
        expect(screen.getByTestId('text')).toBeInTheDocument();
      });
    });
  });
});
