import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

    it('should render TranslatedTextRN component', () => {
      render(
        <TestWrapper>
          <TranslatedTextRN translationKey="welcome.title" />
        </TestWrapper>
      );
      
      // Component should render without crashing
      expect(document.querySelector('text')).toBeInTheDocument();
    });

    it('should render convenience components', () => {
      render(
        <TestWrapper>
          <TranslatedTextRNText translationKey="welcome.title" />
          <TranslatedView translationKey="welcome.title" />
          <TranslatedHeading translationKey="welcome.title" />
          <TranslatedSubheading translationKey="welcome.title" />
          <TranslatedBody translationKey="welcome.title" />
          <TranslatedCaption translationKey="welcome.title" />
        </TestWrapper>
      );
      
      // All components should render without crashing
      const textElements = document.querySelectorAll('text');
      const viewElements = document.querySelectorAll('view');
      expect(textElements.length).toBeGreaterThan(0);
      expect(viewElements.length).toBeGreaterThan(0);
    });
  });

  describe('Props Handling', () => {
    it('should handle translationKey prop', () => {
      render(
        <TestWrapper>
          <TranslatedTextRN translationKey="welcome.title" />
        </TestWrapper>
      );
      
      const element = document.querySelector('text');
      expect(element).toHaveAttribute('translationkey', 'welcome.title');
    });

    it('should handle style prop', () => {
      const style = { color: 'red', fontSize: 16 };
      render(
        <TestWrapper>
          <TranslatedTextRN translationKey="welcome.title" style={style} />
        </TestWrapper>
      );
      
      const element = document.querySelector('text');
      expect(element).toHaveAttribute('style');
    });

    it('should handle debug prop', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(
        <TestWrapper>
          <TranslatedTextRN translationKey="missing.key" debug={true} />
        </TestWrapper>
      );
      
      // Debug mode should log warnings for missing keys
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translations gracefully', () => {
      render(
        <TestWrapper>
          <TranslatedTextRN translationKey="missing.key" fallback="Fallback Text" />
        </TestWrapper>
      );
      
      // Component should render without crashing
      expect(document.querySelector('text')).toBeInTheDocument();
    });

    it('should handle translation service errors', () => {
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

      render(
        <ErrorWrapper>
          <TranslatedTextRN translationKey="welcome.title" />
        </ErrorWrapper>
      );
      
      // Component should render without crashing even with errors
      expect(document.querySelector('text')).toBeInTheDocument();
    });
  });
});
