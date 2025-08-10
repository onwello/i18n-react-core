import React, { ReactNode } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// React Native specific component props
export interface TranslatedTextRNProps {
  translationKey: string;
  params?: Record<string, any>;
  locale?: string;
  fallback?: string;
  component?: React.ComponentType<any>;
  style?: ViewStyle | TextStyle | ImageStyle | (ViewStyle | TextStyle | ImageStyle)[];
  children?: ReactNode;
  debug?: boolean;
}

// React Native specific configuration
export interface ReactNativeTranslationConfig {
  // Platform-specific options
  platform?: {
    enableRTL?: boolean;
    useNativeRTL?: boolean;
    textDirection?: 'ltr' | 'rtl' | 'auto';
  };
  // React Native specific debug options
  debug?: {
    enabled: boolean;
    logMissingKeys?: boolean;
    logPerformance?: boolean;
    showTranslationKeys?: boolean; // Show keys in development
  } | boolean;
}
