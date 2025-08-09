import { SSRTranslationUtils } from './index';
import { ReactTranslationConfig } from '../types';

describe('SSRTranslationUtils', () => {
  let utils: SSRTranslationUtils;
  let config: ReactTranslationConfig;

  beforeEach(() => {
    config = {
      defaultLocale: 'en',
      supportedLocales: ['en', 'fr', 'es'],
      translationsPath: 'test-translations',
      debug: false,
    };
    utils = new SSRTranslationUtils(config);
  });

  afterEach(() => {
    utils.destroy();
  });

  describe('getTranslation', () => {
    it('should get translations for locale', async () => {
      const translations = await utils.getTranslation('en');
      
      expect(translations).toBeDefined();
      expect(typeof translations).toBe('object');
    });

    it('should handle missing translations gracefully', async () => {
      // Mock the translation service to return empty keys for invalid locale
      const mockService = (utils as any).translationService;
      mockService.getKeys.mockImplementationOnce(() => []);
      
      const translations = await utils.getTranslation('invalid-locale');
      
      expect(translations).toEqual({});
    });
  });

  describe('preloadTranslations', () => {
    it('should preload multiple locales', async () => {
      await expect(utils.preloadTranslations(['en', 'fr'])).resolves.not.toThrow();
    });

    it('should handle empty locales array', async () => {
      await expect(utils.preloadTranslations([])).resolves.not.toThrow();
    });
  });

  describe('createSSRContext', () => {
    it('should create SSR context', async () => {
      const context = await utils.createSSRContext('en');
      
      expect(context).toBeDefined();
      expect(context.locale).toBe('en');
      expect(context.translations).toBeDefined();
      expect(context.preloadedLocales).toBeDefined();
    });

    it('should include preloaded locales', async () => {
      const configWithPreload = {
        ...config,
        ssr: {
          enabled: true,
          preloadLocales: ['fr', 'es']
        }
      };
      const utilsWithPreload = new SSRTranslationUtils(configWithPreload);
      
      const context = await utilsWithPreload.createSSRContext('en');
      
      expect(context.preloadedLocales).toContain('fr');
      expect(context.preloadedLocales).toContain('es');
    });
  });

  describe('serializeContext', () => {
    it('should serialize SSR context', async () => {
      const context = await utils.createSSRContext('en');
      const serialized = utils.serializeContext(context);
      
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('en');
    });

    it('should handle empty context', () => {
      const context = {
        locale: 'en',
        translations: {},
        preloadedLocales: [],
      };
      
      const serialized = utils.serializeContext(context);
      expect(typeof serialized).toBe('string');
    });
  });

  describe('deserializeContext', () => {
    it('should deserialize SSR context', async () => {
      const context = await utils.createSSRContext('en');
      const serialized = utils.serializeContext(context);
      const deserialized = utils.deserializeContext(serialized);
      
      expect(deserialized.locale).toBe(context.locale);
      expect(deserialized.translations).toEqual(context.translations);
      expect(deserialized.preloadedLocales).toEqual(context.preloadedLocales);
    });

    it('should handle invalid serialized data', () => {
      const result = utils.deserializeContext('invalid-json');
      expect(result).toEqual({
        locale: 'en',
        translations: {},
        preloadedLocales: []
      });
    });
  });

  describe('createSSRUtils', () => {
    it('should create SSR utils with context', async () => {
      const context = await utils.createSSRContext('en');
      const ssrUtils = utils.createSSRUtils(context);
      
      expect(ssrUtils).toBeDefined();
      expect(ssrUtils.locale).toBe('en');
      expect(typeof ssrUtils.t).toBe('function');
    });

    it('should provide translation function', async () => {
      const context = await utils.createSSRContext('en');
      const ssrUtils = utils.createSSRUtils(context);
      
      const result = ssrUtils.t('welcome.title');
      expect(result).toBe('Welcome');
    });

    it('should provide translation function with parameters', async () => {
      const context = await utils.createSSRContext('en');
      const ssrUtils = utils.createSSRUtils(context);
      
      const result = ssrUtils.t('welcome.message', { name: 'John' });
      expect(result).toBe('Hello, John!');
    });

    it('should handle missing translations', async () => {
      const context = await utils.createSSRContext('en');
      const ssrUtils = utils.createSSRUtils(context);
      
      const result = ssrUtils.t('missing.key');
      expect(result).toBe('missing.key');
    });
  });

  describe('Next.js utilities', () => {
    describe('getServerSideTranslations', () => {
      it('should get server-side translations', async () => {
        const { getServerSideTranslations } = require('./index');
        const result = await getServerSideTranslations('en', config);
        
        expect(result).toBeDefined();
        expect(result.props).toBeDefined();
        expect(result.props.ssrContext).toBeDefined();
      });
    });

    describe('getServerTranslation', () => {
      it('should get server translation function', async () => {
        const { getServerTranslation } = require('./index');
        const result = await getServerTranslation('en', config);
        
        expect(result).toBeDefined();
        expect(typeof result.t).toBe('function');
        expect(result.t('welcome.title')).toBe('Welcome');
      });
    });
  });

  describe('error handling', () => {
    it('should handle translation service errors gracefully', async () => {
      // Mock translation service to throw error
      const mockService = (utils as any).translationService;
      mockService.getKeys.mockImplementationOnce(() => {
        throw new Error('Service error');
      });

      const translations = await utils.getTranslation('en');
      expect(translations).toEqual({});
    });

    it('should handle serialization errors', () => {
      const invalidContext = {
        locale: 'en',
        translations: {},
        preloadedLocales: [],
        // Add circular reference to cause serialization error
        circular: null as any,
      };
      invalidContext.circular = invalidContext;

      expect(() => {
        utils.serializeContext(invalidContext);
      }).toThrow();
    });
  });

  describe('performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [
        utils.getTranslation('en'),
        utils.getTranslation('fr'),
        utils.getTranslation('es'),
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
