import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '../adapters/context';
import { TranslatedTextRNProps } from '../types/react-native';

export const TranslatedTextRN: React.FC<TranslatedTextRNProps> = ({
  translationKey,
  params,
  locale,
  fallback,
  component: Component = Text,
  style,
  children,
  debug = false,
  ...props
}) => {
  const { t, translate, isLoading, error, locale: currentLocale } = useTranslation();

  // Handle loading state
  if (isLoading) {
    return (
      <Component style={style as any} {...props}>
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
      <Component style={style as any} {...props}>
        {fallback || translationKey}
      </Component>
    );
  }

  // Translate the text
  let translatedText: string;
  
  try {
    translatedText = translate(translationKey, params);
    
    // Check if translation failed (returned the key itself)
    if (translatedText === translationKey && fallback) {
      translatedText = fallback;
    }
  } catch (error) {
    if (debug) {
      console.warn(`Translation key not found: ${translationKey}`);
    }
    translatedText = fallback || translationKey;
  }

  // If no translation found and debug is enabled
  if (translatedText === translationKey && debug) {
    console.warn(`Translation key not found: ${translationKey} (locale: ${locale || currentLocale})`);
  }

  // Use fallback if translation is the same as the key (meaning it wasn't found)
  const finalText = translatedText === translationKey && fallback ? fallback : translatedText;

  // Render the component
  return (
    <Component style={style as any} {...props}>
      {children || finalText}
    </Component>
  );
};

// React Native specific convenience components
export const TranslatedText: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN component={Text} {...props} />
);

export const TranslatedView: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN component={View} {...props} />
);

// Custom text components for different styles
export const TranslatedHeading: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 24, fontWeight: 'bold' }, props.style] as any} 
    {...props} 
  />
);

export const TranslatedSubheading: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 18, fontWeight: '600' }, props.style] as any} 
    {...props} 
  />
);

export const TranslatedBody: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 16 }, props.style] as any} 
    {...props} 
  />
);

export const TranslatedCaption: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 14, color: '#666' }, props.style] as any} 
    {...props} 
  />
);
