import '@testing-library/jest-dom';
import React from 'react';

// Mock the core i18n package
jest.mock('@logistically/i18n', () => ({
  TranslationService: jest.fn().mockImplementation(() => ({
    translate: jest.fn((key: string, locale: string, params?: any) => {
      const translations: Record<string, string> = {
        'welcome.title': 'Welcome',
        'welcome.message': 'Hello, {name}!',
        'user.count': 'You have {count} users',
        'user.count_plural': 'You have {count} users',
        'error.not_found': 'Not found',
      };
      let translation = translations[key] || key;
      
      if (params) {
        Object.keys(params).forEach(param => {
          translation = translation.replace(`{${param}}`, params[param]);
        });
      }
      
      return translation;
    }),
    translatePlural: jest.fn((key: string, count: number, locale: string, params?: any) => {
      const translations: Record<string, string> = {
        'user.count': 'You have {count} user',
        'user.count_plural': 'You have {count} users',
      };
      let translation = count === 1 ? translations[key] : translations[`${key}_plural`] || key;
      
      // Replace count parameter
      translation = translation.replace('{count}', count.toString());
      
      // Replace other parameters
      if (params) {
        Object.keys(params).forEach(param => {
          translation = translation.replace(`{${param}}`, params[param]);
        });
      }
      
      return translation;
    }),
    formatNumberForLocale: jest.fn((num: number, locale: string) => num.toString()),
    formatDateForLocale: jest.fn((date: Date, locale: string) => date.toLocaleDateString()),
    getTextDirection: jest.fn(() => 'ltr'),
    isRTLLocale: jest.fn(() => false),
    getKeys: jest.fn(() => ['welcome.title', 'welcome.message', 'user.count']),
    reloadTranslations: jest.fn(),
    clearCache: jest.fn(),
  })),
  TranslationConfig: jest.fn(),
}));

// Mock React Native components for testing
jest.mock('react-native', () => ({
  Text: 'text',
  View: 'view',
}));


