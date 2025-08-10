import { TranslationCore } from './TranslationCore';
import { ReactTranslationConfig } from '../types';

describe('TranslationCore', () => {
  let core: TranslationCore;
  let config: ReactTranslationConfig;

  beforeEach(() => {
    config = {
      defaultLocale: 'en',
      supportedLocales: ['en', 'fr', 'es'],
      translationsPath: 'test-translations',
      debug: false,
      serviceName: 'test-service',
    };
    core = new TranslationCore(config);
  });

  afterEach(() => {
    core.destroy();
  });

  describe('initialization', () => {
    it('should initialize with correct config', () => {
      expect(core.getState().locale).toBe('en');
      expect(core.getState().isInitialized).toBe(false);
      expect(core.getState().isLoading).toBe(false);
    });

    it('should initialize successfully', async () => {
      await core.initialize();
      
      expect(core.getState().isInitialized).toBe(true);
      expect(core.getState().isLoading).toBe(false);
    });

    it('should initialize with custom locale', async () => {
      await core.initialize('fr');
      
      expect(core.getState().locale).toBe('fr');
      expect(core.getState().isInitialized).toBe(true);
    });
  });

  describe('translation', () => {
    beforeEach(async () => {
      await core.initialize();
    });

    it('should translate text correctly', () => {
      const result = core.translate('welcome.title');
      expect(result).toBe('Welcome');
    });

    it('should translate with parameters', () => {
      const result = core.translate('welcome.message', { name: 'John' });
      expect(result).toBe('Hello, John!');
    });

    it('should handle missing translations', () => {
      const result = core.translate('missing.key');
      expect(result).toBe('missing.key');
    });

    it('should translate plural forms', () => {
      const result = core.translatePlural('user.count', 5);
      expect(result).toBe('You have 5 users');
    });
  });

  describe('locale management', () => {
    beforeEach(async () => {
      await core.initialize();
    });

    it('should change locale', async () => {
      await core.setLocale('fr');
      expect(core.getState().locale).toBe('fr');
    });

    it('should load translations for new locale', async () => {
      await core.setLocale('fr');
      expect(core.getState().translations).toBeDefined();
    });
  });

  describe('formatting', () => {
    beforeEach(async () => {
      await core.initialize();
    });

    it('should format numbers', () => {
      const result = core.formatNumber(1234.56);
      expect(result).toBe('1234.56');
    });

    it('should format dates', () => {
      const date = new Date('2023-01-01');
      const result = core.formatDate(date);
      expect(result).toBeDefined();
    });
  });

  describe('RTL support', () => {
    beforeEach(async () => {
      await core.initialize();
    });

    it('should detect RTL locales', () => {
      const result = core.isRTLLocale('ar');
      expect(typeof result).toBe('boolean');
    });

    it('should get text direction', () => {
      const result = core.getTextDirection('Hello');
      expect(result).toBe('ltr');
    });
  });

  describe('state management', () => {
    it('should notify listeners of state changes', async () => {
      const listener = jest.fn();
      const unsubscribe = core.subscribe(listener);

      await core.initialize();
      
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should handle multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      const unsubscribe1 = core.subscribe(listener1);
      const unsubscribe2 = core.subscribe(listener2);

      await core.initialize();
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock the translation service to throw an error during initialization
      const mockService = jest.fn().mockImplementation(() => ({
        translate: jest.fn(),
        translatePlural: jest.fn(),
        formatNumberForLocale: jest.fn(),
        formatDateForLocale: jest.fn(),
        getTextDirection: jest.fn(),
        isRTLLocale: jest.fn(),
        getKeys: jest.fn(() => {
          throw new Error('Initialization error');
        }),
        reloadTranslations: jest.fn(),
        clearCache: jest.fn(),
      }));

      // Temporarily replace the TranslationService constructor
      const originalService = require('@logistically/i18n').TranslationService;
      require('@logistically/i18n').TranslationService = mockService;

      const errorCore = new TranslationCore(config);
      
      await expect(errorCore.initialize()).rejects.toThrow();
      errorCore.destroy();

      // Restore original service
      require('@logistically/i18n').TranslationService = originalService;
    });

    it('should handle translation errors gracefully', async () => {
      await core.initialize();
      
      // Mock translation service to throw error
      const mockService = (core as any).translationService;
      mockService.translate.mockImplementationOnce(() => {
        throw new Error('Translation error');
      });

      const result = core.translate('error.key');
      expect(result).toBe('error.key');
    });

    it('should handle plural translation errors gracefully', async () => {
      await core.initialize();
      
      // Mock translation service to throw error
      const mockService = (core as any).translationService;
      mockService.translatePlural.mockImplementationOnce(() => {
        throw new Error('Translation error');
      });

      const result = core.translatePlural('error.key', 5);
      expect(result).toBe('error.key');
    });
  });

  describe('adapter management', () => {
    it('should set and get adapter', () => {
      const core = new TranslationCore(config);
      const mockAdapter = {
        getState: jest.fn(),
        getActions: jest.fn(),
        subscribe: jest.fn(),
        initialize: jest.fn(),
        destroy: jest.fn()
      };

      core.setAdapter(mockAdapter);
      expect(core.getAdapter()).toBe(mockAdapter);
    });

    it('should return undefined when no adapter is set', () => {
      const core = new TranslationCore(config);
      expect(core.getAdapter()).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should get translation service', () => {
      const core = new TranslationCore(config);
      const service = core.getTranslationService();
      expect(service).toBeDefined();
      expect(service).toBe(core['translationService']);
    });

    it('should get config', () => {
      const core = new TranslationCore(config);
      const retrievedConfig = core.getConfig();
      expect(retrievedConfig).toEqual(config);
    });

    it('should check if initialized', () => {
      const core = new TranslationCore(config);
      expect(core.isInitialized()).toBe(false);
      
      // After initialization
      core['state'].isInitialized = true;
      expect(core.isInitialized()).toBe(true);
    });
  });

  describe('debug configuration', () => {
    it('should handle boolean debug config', () => {
      const debugConfig = { ...config, debug: true };
      const core = new TranslationCore(debugConfig);
      
      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock translation service to throw error
      jest.spyOn(core['translationService'], 'translate').mockImplementation(() => {
        throw new Error('Translation error');
      });

      core.translate('test.key');
      
      // With boolean debug=true, logMissingKeys should be undefined, so no warning
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle object debug config with logMissingKeys', () => {
      const debugConfig = { 
        ...config, 
        debug: { enabled: true, logMissingKeys: true } 
      };
      const core = new TranslationCore(debugConfig);
      
      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock translation service to throw error
      jest.spyOn(core['translationService'], 'translate').mockImplementation(() => {
        throw new Error('Translation error');
      });

      core.translate('test.key');
      
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: test.key (locale: en)');
      
      consoleSpy.mockRestore();
    });

    it('should handle object debug config without logMissingKeys', () => {
      const debugConfig = { 
        ...config, 
        debug: { enabled: true, logMissingKeys: false } 
      };
      const core = new TranslationCore(debugConfig);
      
      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock translation service to throw error
      jest.spyOn(core['translationService'], 'translate').mockImplementation(() => {
        throw new Error('Translation error');
      });

      core.translate('test.key');
      
      // Should not log warning when logMissingKeys is false
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle object debug config with undefined logMissingKeys', () => {
      const debugConfig = { 
        ...config, 
        debug: { enabled: true } 
      };
      const core = new TranslationCore(debugConfig);
      
      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock translation service to throw error
      jest.spyOn(core['translationService'], 'translate').mockImplementation(() => {
        throw new Error('Translation error');
      });

      core.translate('test.key');
      
      // Should not log warning when logMissingKeys is undefined
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling edge cases', () => {
    it('should handle translatePlural with object debug config and logMissingKeys enabled', () => {
      const debugConfig = { 
        ...config, 
        debug: { enabled: true, logMissingKeys: true } 
      };
      const core = new TranslationCore(debugConfig);
      
      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock translation service to throw error
      jest.spyOn(core['translationService'], 'translatePlural').mockImplementation(() => {
        throw new Error('Translation error');
      });

      core.translatePlural('test.key', 5);
      
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: test.key (locale: en)');
      
      consoleSpy.mockRestore();
    });

    it('should handle translatePlural with object debug config and logMissingKeys disabled', () => {
      const debugConfig = { 
        ...config, 
        debug: { enabled: true, logMissingKeys: false } 
      };
      const core = new TranslationCore(debugConfig);
      
      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock translation service to throw error
      jest.spyOn(core['translationService'], 'translatePlural').mockImplementation(() => {
        throw new Error('Translation error');
      });

      core.translatePlural('test.key', 5);
      
      // Should not log warning when logMissingKeys is false
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle initialization error properly', async () => {
      const core = new TranslationCore(config);
      
      // Mock loadTranslations to throw error
      jest.spyOn(core as any, 'loadTranslations').mockRejectedValue(new Error('Load error'));
      
      await expect(core.initialize()).rejects.toThrow('Load error');
      
      expect(core.getState().isLoading).toBe(false);
      expect(core.getState().error).toBeDefined();
    });

    it('should handle setLocale error properly', async () => {
      const core = new TranslationCore(config);
      await core.initialize();
      
      // Mock loadTranslations to throw error
      jest.spyOn(core as any, 'loadTranslations').mockRejectedValue(new Error('Load error'));
      
      await expect(core.setLocale('fr')).rejects.toThrow('Load error');
      
      expect(core.getState().isLoading).toBe(false);
      expect(core.getState().error).toBeDefined();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle translation service errors gracefully', async () => {
      const mockTranslationService = {
        translate: jest.fn().mockImplementation(() => {
          throw new Error('Translation service error');
        }),
        translatePlural: jest.fn().mockImplementation(() => {
          throw new Error('Translation service error');
        }),
        formatDateForLocale: jest.fn().mockReturnValue('formatted date'),
        formatNumberForLocale: jest.fn().mockReturnValue('formatted number'),
        getTextDirection: jest.fn().mockReturnValue('ltr'),
        isRTLLocale: jest.fn().mockReturnValue(false),
        clearCache: jest.fn(),
        loadTranslationsForLocale: jest.fn().mockResolvedValue({}),
        reloadTranslations: jest.fn().mockResolvedValue(undefined),
        getKeys: jest.fn().mockReturnValue([])
      };

      const core = new TranslationCore({
        serviceName: 'test-service',
        defaultLocale: 'en',
        debug: { enabled: true, logMissingKeys: true }
      });

      // Replace the translation service with our mock
      (core as any).translationService = mockTranslationService;

      // Test translate with error
      const result = core.translate('test.key');
      expect(result).toBe('test.key'); // Should return the key on error

      // Test translatePlural with error
      const pluralResult = core.translatePlural('test.key', 1);
      expect(pluralResult).toBe('test.key'); // Should return the key on error
    });

    it('should handle initialization errors properly', async () => {
      const mockTranslationService = {
        translate: jest.fn().mockReturnValue('translated'),
        translatePlural: jest.fn().mockReturnValue('translated'),
        formatDateForLocale: jest.fn().mockReturnValue('formatted date'),
        formatNumberForLocale: jest.fn().mockReturnValue('formatted number'),
        getTextDirection: jest.fn().mockReturnValue('ltr'),
        isRTLLocale: jest.fn().mockReturnValue(false),
        clearCache: jest.fn(),
        loadTranslationsForLocale: jest.fn().mockResolvedValue({}),
        reloadTranslations: jest.fn().mockImplementation(() => {
          throw new Error('Load error');
        }),
        getKeys: jest.fn().mockReturnValue([])
      };

      const core = new TranslationCore({
        serviceName: 'test-service',
        defaultLocale: 'en',
        debug: { enabled: true, logMissingKeys: true }
      });

      // Replace the translation service with our mock
      (core as any).translationService = mockTranslationService;

      await expect(core.initialize('en')).rejects.toThrow('Load error');
      
      // State should be updated to reflect the error
      const state = core.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toBe('Load error');
    });

    it('should handle setLocale errors properly', async () => {
      const mockTranslationService = {
        translate: jest.fn().mockReturnValue('translated'),
        translatePlural: jest.fn().mockReturnValue('translated'),
        formatDateForLocale: jest.fn().mockReturnValue('formatted date'),
        formatNumberForLocale: jest.fn().mockReturnValue('formatted number'),
        getTextDirection: jest.fn().mockReturnValue('ltr'),
        isRTLLocale: jest.fn().mockReturnValue(false),
        clearCache: jest.fn(),
        loadTranslationsForLocale: jest.fn().mockResolvedValue({}),
        reloadTranslations: jest.fn().mockImplementation(() => {
          throw new Error('Load error');
        }),
        getKeys: jest.fn().mockReturnValue([])
      };

      const core = new TranslationCore({
        serviceName: 'test-service',
        defaultLocale: 'en',
        debug: { enabled: true, logMissingKeys: true }
      });

      // Replace the translation service with our mock
      (core as any).translationService = mockTranslationService;

      await expect(core.setLocale('es')).rejects.toThrow('Load error');
      
      // State should be updated to reflect the error
      const state = core.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toBe('Load error');
    });

    it('should handle loadTranslations errors properly', async () => {
      const mockTranslationService = {
        translate: jest.fn().mockReturnValue('translated'),
        translatePlural: jest.fn().mockReturnValue('translated'),
        formatDateForLocale: jest.fn().mockReturnValue('formatted date'),
        formatNumberForLocale: jest.fn().mockReturnValue('formatted number'),
        getTextDirection: jest.fn().mockReturnValue('ltr'),
        isRTLLocale: jest.fn().mockReturnValue(false),
        clearCache: jest.fn(),
        loadTranslationsForLocale: jest.fn().mockResolvedValue({}),
        reloadTranslations: jest.fn().mockImplementation(() => {
          throw new Error('Load error');
        }),
        getKeys: jest.fn().mockReturnValue([])
      };

      const core = new TranslationCore({
        serviceName: 'test-service',
        defaultLocale: 'en',
        debug: { enabled: true, logMissingKeys: true }
      });

      // Replace the translation service with our mock
      (core as any).translationService = mockTranslationService;

      await expect(core.loadTranslations('es')).rejects.toThrow('Load error');
      
      // State should be updated to reflect the error
      const state = core.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toBe('Load error');
    });

    it('should handle debug configuration properly', () => {
      const core = new TranslationCore({
        serviceName: 'test-service',
        defaultLocale: 'en',
        debug: { enabled: true, logMissingKeys: true }
      });

      // Test with debug enabled
      const result = core.translate('missing.key');
      expect(result).toBe('missing.key');

      // Test with debug disabled
      const coreNoDebug = new TranslationCore({
        serviceName: 'test-service',
        defaultLocale: 'en',
        debug: { enabled: false, logMissingKeys: false }
      });

      const resultNoDebug = coreNoDebug.translate('missing.key');
      expect(resultNoDebug).toBe('missing.key');
    });
  });
});
