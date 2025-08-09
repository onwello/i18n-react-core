import React, { ReactNode } from 'react';
import { useTranslation } from '../adapters/context';
import { TranslatedTextProps } from '../types';

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  translationKey,
  params,
  locale,
  fallback,
  component: Component = 'span',
  className,
  style,
  children,
  debug = false,
  ...props
}) => {
  const { t, translate, isLoading, error } = useTranslation();

  // Handle loading state
  if (isLoading) {
    return (
      <Component className={className} style={style} {...props}>
        {fallback || translationKey}
      </Component>
    );
  }

  // Handle error state
  if (error) {
    if (debug) {
      console.error('Translation error:', error);
    }
    return (
      <Component className={className} style={style} {...props}>
        {fallback || translationKey}
      </Component>
    );
  }

  // Translate the text
  let translatedText: string;
  
  try {
    if (locale) {
      // Use specific locale
      translatedText = translate(translationKey, params);
    } else {
      // Use current locale
      translatedText = t(translationKey, { params });
    }
  } catch (error) {
    if (debug) {
      console.warn(`Translation failed for key: ${translationKey}`, error);
    }
    translatedText = fallback || translationKey;
  }

  // If no translation found and debug is enabled
  if (translatedText === translationKey && debug) {
    console.warn(`Translation key not found: ${translationKey} (locale: ${locale || 'current'})`);
  }

  // Use fallback if translation is the same as the key (meaning it wasn't found)
  const finalText = translatedText === translationKey && fallback ? fallback : translatedText;

  // Render the component
  return (
    <Component className={className} style={style} {...props}>
      {children || finalText}
    </Component>
  );
};

// Convenience components for common HTML elements
export const TranslatedSpan: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="span" {...props} />
);

export const TranslatedDiv: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="div" {...props} />
);

export const TranslatedP: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="p" {...props} />
);

export const TranslatedH1: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="h1" {...props} />
);

export const TranslatedH2: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="h2" {...props} />
);

export const TranslatedH3: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="h3" {...props} />
);

export const TranslatedLabel: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="label" {...props} />
);

export const TranslatedButton: React.FC<Omit<TranslatedTextProps, 'component'>> = (props) => (
  <TranslatedText component="button" {...props} />
);
