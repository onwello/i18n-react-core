import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '../adapters/context';
import { TranslatedTextRNProps } from '../types/react-native';

export const TranslatedTextRN: React.FC<TranslatedTextRNProps> = ({
  key: translationKey,
  params,
  locale,
  fallback,
  component: Component = Text,
  style,
  children,
  debug = false,
  ...props
}) => {
  const { t, translate, isLoading, error } = useTranslation();

  // Handle loading state
  if (isLoading) {
    return (
      <Component style={style} {...props}>
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
      <Component style={style} {...props}>
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
    console.warn(`Translation key not found: ${translationKey}`);
  }

  // Render the component
  return (
    <Component style={style} {...props}>
      {children || translatedText}
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
    style={[{ fontSize: 24, fontWeight: 'bold' }, props.style]} 
    {...props} 
  />
);

export const TranslatedSubheading: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 18, fontWeight: '600' }, props.style]} 
    {...props} 
  />
);

export const TranslatedBody: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 16 }, props.style]} 
    {...props} 
  />
);

export const TranslatedCaption: React.FC<TranslatedTextRNProps> = (props) => (
  <TranslatedTextRN 
    component={Text} 
    style={[{ fontSize: 14, color: '#666' }, props.style]} 
    {...props} 
  />
);
