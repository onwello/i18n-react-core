import { TranslationService, TranslationConfig } from '@logistically/i18n';
import { SSRContext, SSRUtils, ReactTranslationConfig } from '../types';

export class SSRTranslationUtils implements SSRUtils {
  public translationService: TranslationService;
  private config: ReactTranslationConfig;

  constructor(config: ReactTranslationConfig) {
    this.config = config;
    
    // Convert ReactTranslationConfig to TranslationConfig
    const coreConfig: TranslationConfig = {
      ...config,
      debug: typeof config.debug === 'boolean' ? config.debug : config.debug?.enabled || false
    };
    
    this.translationService = new TranslationService(coreConfig);
  }

  async getTranslation(locale: string): Promise<Record<string, any>> {
    try {
      this.translationService.reloadTranslations();
      const keys = this.translationService.getKeys(locale);
      const translations: Record<string, any> = {};
      
      keys.forEach(key => {
        translations[key] = this.translationService.translate(key, locale);
      });
      
      return translations;
    } catch (error) {
      console.error(`Failed to load translations for locale: ${locale}`, error);
      return {};
    }
  }

  async preloadTranslations(locales: string[]): Promise<void> {
    const promises = locales.map(locale => this.getTranslation(locale));
    await Promise.all(promises);
  }

  async createSSRContext(locale: string): Promise<SSRContext> {
    const translations = await this.getTranslation(locale);
    
    return {
      locale,
      translations,
      preloadedLocales: this.config.ssr?.preloadLocales || []
    };
  }

  serializeContext(context: SSRContext): string {
    return JSON.stringify(context);
  }

  deserializeContext(serialized: string): SSRContext {
    try {
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to deserialize SSR context:', error);
      return {
        locale: 'en',
        translations: {},
        preloadedLocales: []
      };
    }
  }

  // Create SSR utils with context
  createSSRUtils(context: SSRContext) {
    return {
      locale: context.locale,
      translations: context.translations,
      t: (key: string, params?: Record<string, any>) => {
        const translation = context.translations[key] || key;
        
        if (params) {
          return Object.keys(params).reduce((result, param) => {
            return result.replace(`{${param}}`, params[param]);
          }, translation);
        }
        
        return translation;
      },
    };
  }

  // Cleanup method
  destroy(): void {
    // Cleanup any resources if needed
  }
}

// Server-side translation function
export const getTranslation = async (
  locale: string,
  config: ReactTranslationConfig
): Promise<Record<string, any>> => {
  const utils = new SSRTranslationUtils(config);
  return utils.getTranslation(locale);
};

// Preload translations for multiple locales
export const preloadTranslations = async (
  locales: string[],
  config: ReactTranslationConfig
): Promise<void> => {
  const utils = new SSRTranslationUtils(config);
  await utils.preloadTranslations(locales);
};

// Create SSR context
export const createSSRContext = async (
  locale: string,
  config: ReactTranslationConfig
): Promise<SSRContext> => {
  const utils = new SSRTranslationUtils(config);
  return utils.createSSRContext(locale);
};

// Serialize context for client hydration
export const serializeContext = (context: SSRContext): string => {
  const utils = new SSRTranslationUtils({} as ReactTranslationConfig);
  return utils.serializeContext(context);
};

// Deserialize context on client
export const deserializeContext = (serialized: string): SSRContext => {
  const utils = new SSRTranslationUtils({} as ReactTranslationConfig);
  return utils.deserializeContext(serialized);
};

// Next.js specific utilities
export const getServerSideTranslations = async (
  locale: string,
  config: ReactTranslationConfig
) => {
  const utils = new SSRTranslationUtils(config);
  const context = await utils.createSSRContext(locale);
  
  return {
    props: {
      ssrContext: utils.serializeContext(context)
    }
  };
};

// React Server Component support
export const getServerTranslation = async (
  locale: string,
  config: ReactTranslationConfig
) => {
  const utils = new SSRTranslationUtils(config);
  const translations = await utils.getTranslation(locale);
  
  return {
    t: (key: string, params?: Record<string, any>) => {
      try {
        return utils.translationService.translate(key, locale, params);
      } catch {
        return key;
      }
    },
    translations,
    locale
  };
};
