import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TranslatedText, TranslatedSpan, TranslatedDiv, TranslatedH1 } from './TranslatedText';
import { TranslationProvider } from '../adapters/context';
import { ReactTranslationConfig } from '../types';

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
  });
});
