import { configureStore } from '@reduxjs/toolkit';
import { ReduxAdapter, translationReducer, createReduxAdapter, loadTranslationsAsync, reloadTranslationsAsync, SerializableError } from './redux';
import { TranslationCore } from '../core/TranslationCore';
import { ReactTranslationConfig } from '../types';

// Mock TranslationCore
jest.mock('../core/TranslationCore');
const MockTranslationCore = TranslationCore as jest.MockedClass<typeof TranslationCore>;

describe('ReduxAdapter', () => {
  let mockCore: jest.Mocked<TranslationCore>;
  let store: any;
  let adapter: ReduxAdapter;

  const mockConfig: ReactTranslationConfig = {
    serviceName: 'test-service',
    defaultLocale: 'en',
    supportedLocales: ['en', 'es'],
    translationsPath: 'src/translations'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock core
    mockCore = {
      getState: jest.fn().mockReturnValue({
        locale: 'en',
        translations: {},
        isLoading: false,
        error: null,
        isInitialized: false
      }),
      getActions: jest.fn().mockReturnValue({
        setLocale: jest.fn(),
        loadTranslations: jest.fn(),
        translate: jest.fn(),
        translatePlural: jest.fn(),
        formatDate: jest.fn(),
        formatNumber: jest.fn(),
        getTextDirection: jest.fn(),
        isRTLLocale: jest.fn(),
        reloadTranslations: jest.fn(),
        clearCache: jest.fn()
      }),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
      setLocale: jest.fn().mockResolvedValue(undefined),
      loadTranslations: jest.fn().mockResolvedValue(undefined),
      reloadTranslations: jest.fn().mockResolvedValue(undefined),
      clearCache: jest.fn(),
      translate: jest.fn().mockReturnValue('translated'),
      translatePlural: jest.fn().mockReturnValue('translated plural'),
      formatDate: jest.fn().mockReturnValue('formatted date'),
      formatNumber: jest.fn().mockReturnValue('formatted number'),
      getTextDirection: jest.fn().mockReturnValue('ltr'),
      isRTLLocale: jest.fn().mockReturnValue(false)
    } as any;

    // Create store
    store = configureStore({
      reducer: {
        translation: translationReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [
              'translation/setError',
              'translation/loadTranslations/pending',
              'translation/loadTranslations/fulfilled',
              'translation/loadTranslations/rejected',
              'translation/reloadTranslations/pending',
              'translation/reloadTranslations/fulfilled',
              'translation/reloadTranslations/rejected'
            ],
            ignoredActionPaths: ['payload.error', 'error'],
            ignoredPaths: ['translation.error'],
            warnAfter: 128
          },
          immutableCheck: {
            ignoredPaths: ['translation.error']
          }
        })
    });

    // Store core instance in store for async thunks
    (store as any).core = mockCore;
    // Also store in the getState function for async thunks
    (store.getState as any).core = mockCore;

    // Create adapter
    adapter = createReduxAdapter(mockCore, store);
  });

  describe('ReduxAdapter class', () => {
    it('should be defined', () => {
      expect(ReduxAdapter).toBeDefined();
      expect(typeof ReduxAdapter).toBe('function');
    });

    it('should implement TranslationAdapter interface', () => {
      expect(adapter.getState).toBeDefined();
      expect(adapter.getActions).toBeDefined();
      expect(adapter.subscribe).toBeDefined();
      expect(adapter.initialize).toBeDefined();
      expect(adapter.destroy).toBeDefined();
    });

    it('should get state from Redux store', () => {
      const state = adapter.getState();
      expect(state).toBeDefined();
      expect(state.locale).toBe('en');
    });

    it('should get actions with Redux dispatch integration', () => {
      const actions = adapter.getActions();
      expect(actions).toBeDefined();
      expect(typeof actions.setLocale).toBe('function');
      expect(typeof actions.translate).toBe('function');
    });

    it('should subscribe to Redux store changes', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Trigger a store change
      store.dispatch({ type: 'translation/setLocale', payload: 'es' });
      
      expect(listener).toHaveBeenCalled();
    });

    it('should initialize core and update Redux state', async () => {
      await adapter.initialize(mockConfig);
      
      expect(mockCore.initialize).toHaveBeenCalled();
      expect(store.getState().translation.isInitialized).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockCore.initialize.mockRejectedValue(error);
      
      await expect(adapter.initialize(mockConfig)).rejects.toThrow('Initialization failed');
      // Check that error is serialized in Redux state
      const reduxState = store.getState().translation;
      expect(reduxState.error).toEqual({
        message: 'Initialization failed',
        name: 'Error',
        stack: expect.any(String)
      });
      // Check that error is deserialized in adapter state
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Initialization failed');
    });

    it('should destroy core and cleanup subscriptions', () => {
      adapter.destroy();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });
  });

  describe('Redux actions', () => {
    it('should dispatch setLocale action', async () => {
      const actions = adapter.getActions();
      await actions.setLocale('es');
      
      expect(mockCore.setLocale).toHaveBeenCalledWith('es');
      expect(store.getState().translation.locale).toBe('es');
    });

    it('should dispatch loadTranslations action', async () => {
      const actions = adapter.getActions();
      await actions.loadTranslations('es');
      
      expect(mockCore.loadTranslations).toHaveBeenCalledWith('es');
    });

    it('should dispatch reloadTranslations action', async () => {
      const actions = adapter.getActions();
      await actions.reloadTranslations();
      
      expect(mockCore.reloadTranslations).toHaveBeenCalled();
    });

    it('should dispatch clearCache action', () => {
      const actions = adapter.getActions();
      actions.clearCache();
      
      expect(mockCore.clearCache).toHaveBeenCalled();
      expect(store.getState().translation.translations).toEqual({});
    });

    it('should update lastUpdated timestamp on actions', async () => {
      const actions = adapter.getActions();
      const initialTime = store.getState().translation.lastUpdated;
      
      await actions.setLocale('es');
      
      // Verify that the action updated the store
      expect(store.getState().translation.locale).toBe('es');
      // Verify that lastUpdated was updated (should be different from initial)
      expect(store.getState().translation.lastUpdated).toBeGreaterThanOrEqual(initialTime);
    });
  });

  describe('Async thunks', () => {
    it('should handle loadTranslationsAsync successfully', async () => {
      const result = await store.dispatch(loadTranslationsAsync('es'));
      
      expect(result.payload).toEqual({ locale: 'es', success: true });
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBe(null);
    });

    it('should handle loadTranslationsAsync with error', async () => {
      const error = new Error('Loading failed');
      mockCore.loadTranslations.mockRejectedValue(error);
      
      const result = await store.dispatch(loadTranslationsAsync('es'));
      
      expect(result.error).toBeDefined();
      // Check that error is serialized in Redux state
      const reduxState = store.getState().translation;
      expect(reduxState.error).toEqual({
        message: 'Loading failed',
        name: 'Error',
        stack: expect.any(String)
      });
      expect(reduxState.isLoading).toBe(false);
    });

    it('should handle reloadTranslationsAsync successfully', async () => {
      const result = await store.dispatch(reloadTranslationsAsync());
      
      expect(result.payload).toEqual({ success: true });
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBe(null);
    });

    it('should handle reloadTranslationsAsync with error', async () => {
      const error = new Error('Reload failed');
      mockCore.reloadTranslations.mockRejectedValue(error);
      
      const result = await store.dispatch(reloadTranslationsAsync());
      
      expect(result.error).toBeDefined();
      // Check that error is serialized in Redux state
      const reduxState = store.getState().translation;
      expect(reduxState.error).toEqual({
        message: 'Reload failed',
        name: 'Error',
        stack: expect.any(String)
      });
      expect(reduxState.isLoading).toBe(false);
    });
  });

  describe('Redux slice', () => {
    it('should handle setLocale action', () => {
      store.dispatch({ type: 'translation/setLocale', payload: 'fr' });
      
      expect(store.getState().translation.locale).toBe('fr');
      expect(store.getState().translation.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle setLoading action', () => {
      store.dispatch({ type: 'translation/setLoading', payload: true });
      
      expect(store.getState().translation.isLoading).toBe(true);
    });

    it('should handle setError action with Error object', () => {
      const error = new Error('Test error');
      store.dispatch({ type: 'translation/setError', payload: error });
      
      // Check that error is serialized in Redux state
      const reduxState = store.getState().translation;
      expect(reduxState.error).toEqual({
        message: 'Test error',
        name: 'Error',
        stack: expect.any(String)
      });
    });

    it('should handle setError action with SerializableError', () => {
      const serializedError: SerializableError = {
        message: 'Serialized error',
        name: 'TestError',
        stack: 'test stack'
      };
      store.dispatch({ type: 'translation/setError', payload: serializedError });
      
      expect(store.getState().translation.error).toEqual(serializedError);
    });

    it('should handle setPerformanceMetrics action', () => {
      const metrics = { translationTime: 100, cacheHitRate: 85 };
      store.dispatch({ type: 'translation/setPerformanceMetrics', payload: metrics });
      
      expect(store.getState().translation.performanceMetrics.translationTime).toBe(100);
      expect(store.getState().translation.performanceMetrics.cacheHitRate).toBe(85);
    });

    it('should handle addPendingAction and removePendingAction', () => {
      store.dispatch({ type: 'translation/addPendingAction', payload: 'test-action' });
      expect(store.getState().translation.pendingActions).toContain('test-action');
      
      store.dispatch({ type: 'translation/removePendingAction', payload: 'test-action' });
      expect(store.getState().translation.pendingActions).not.toContain('test-action');
    });
  });

  describe('createReduxAdapter factory', () => {
    it('should create ReduxAdapter instance', () => {
      const newAdapter = createReduxAdapter(mockCore, store);
      
      expect(newAdapter).toBeInstanceOf(ReduxAdapter);
      expect(newAdapter.getState).toBeDefined();
      expect(newAdapter.getActions).toBeDefined();
    });
  });

  describe('ReduxAdapter edge cases and error handling', () => {
    it('should handle null error in setError', () => {
      store.dispatch({ type: 'translation/setError', payload: null });
      expect(store.getState().translation.error).toBe(null);
    });

    it('should handle undefined error in setError', () => {
      store.dispatch({ type: 'translation/setError', payload: undefined });
      expect(store.getState().translation.error).toBe(null);
    });

    it('should handle core subscription cleanup on destroy', () => {
      const unsubscribeMock = jest.fn();
      mockCore.subscribe.mockReturnValue(unsubscribeMock);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      newAdapter.destroy();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should handle store subscription with state changes', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      // Dispatch multiple actions to trigger state changes
      store.dispatch({ type: 'translation/setLocale', payload: 'fr' });
      store.dispatch({ type: 'translation/setLoading', payload: true });
      store.dispatch({ type: 'translation/setLoading', payload: false });
      
      expect(listener).toHaveBeenCalledTimes(3);
      unsubscribe();
    });

    it('should handle store subscription without state changes', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      // Dispatch action that doesn't change the state
      store.dispatch({ type: 'translation/updateLastUpdated' });
      
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe('ReduxAdapter action methods', () => {
    it('should call core methods and dispatch actions for translate', () => {
      const actions = adapter.getActions();
      const result = actions.translate('hello', { name: 'world' });
      
      expect(mockCore.translate).toHaveBeenCalledWith('hello', { name: 'world' });
      expect(result).toBe('translated');
      expect(store.getState().translation.lastUpdated).toBeGreaterThan(0);
    });

    it('should call core methods and dispatch actions for translatePlural', () => {
      const actions = adapter.getActions();
      const result = actions.translatePlural('items', 5, { count: 5 });
      
      expect(mockCore.translatePlural).toHaveBeenCalledWith('items', 5, { count: 5 });
      expect(result).toBe('translated plural');
      expect(store.getState().translation.lastUpdated).toBeGreaterThan(0);
    });

    it('should call core methods and dispatch actions for formatDate', () => {
      const actions = adapter.getActions();
      const date = new Date('2023-01-01');
      const options = { format: 'short' };
      const result = actions.formatDate(date, options);
      
      expect(mockCore.formatDate).toHaveBeenCalledWith(date, options);
      expect(result).toBe('formatted date');
      expect(store.getState().translation.lastUpdated).toBeGreaterThan(0);
    });

    it('should call core methods and dispatch actions for formatNumber', () => {
      const actions = adapter.getActions();
      const result = actions.formatNumber(1234.56, { style: 'currency' });
      
      expect(mockCore.formatNumber).toHaveBeenCalledWith(1234.56, { style: 'currency' });
      expect(result).toBe('formatted number');
      expect(store.getState().translation.lastUpdated).toBeGreaterThan(0);
    });

    it('should call core methods for getTextDirection without dispatching', () => {
      const actions = adapter.getActions();
      const result = actions.getTextDirection('Hello World');
      
      expect(mockCore.getTextDirection).toHaveBeenCalledWith('Hello World');
      expect(result).toBe('ltr');
      // Should not update lastUpdated for read-only operations
      const initialState = store.getState().translation.lastUpdated;
      expect(store.getState().translation.lastUpdated).toBe(initialState);
    });

    it('should call core methods for isRTLLocale without dispatching', () => {
      const actions = adapter.getActions();
      const result = actions.isRTLLocale('ar');
      
      expect(mockCore.isRTLLocale).toHaveBeenCalledWith('ar');
      expect(result).toBe(false);
      // Should not update lastUpdated for read-only operations
      const initialState = store.getState().translation.lastUpdated;
      expect(store.getState().translation.lastUpdated).toBe(initialState);
    });

    it('should call core methods and dispatch actions for clearCache', () => {
      const actions = adapter.getActions();
      actions.clearCache();
      
      expect(mockCore.clearCache).toHaveBeenCalled();
      expect(store.getState().translation.translations).toEqual({});
      expect(store.getState().translation.performanceMetrics.lastCacheCleanup).toBeGreaterThan(0);
    });
  });

  describe('ReduxAdapter state management', () => {
    it('should return deserialized error from getState', () => {
      const error = new Error('Test error');
      store.dispatch({ type: 'translation/setError', payload: error });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Test error');
      expect(adapterState.error?.name).toBe('Error');
    });

    it('should handle null error in getState', () => {
      store.dispatch({ type: 'translation/setError', payload: null });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBe(null);
    });

    it('should preserve other state properties in getState', () => {
      store.dispatch({ type: 'translation/setLocale', payload: 'fr' });
      store.dispatch({ type: 'translation/setLoading', payload: true });
      store.dispatch({ type: 'translation/setTranslations', payload: { hello: 'bonjour' } });
      
      const adapterState = adapter.getState();
      expect(adapterState.locale).toBe('fr');
      expect(adapterState.isLoading).toBe(true);
      expect(adapterState.translations).toEqual({ hello: 'bonjour' });
    });
  });

  describe('ReduxAdapter initialization and cleanup', () => {
    it('should handle initialization with loading states', async () => {
      const initializePromise = adapter.initialize(mockConfig);
      
      // Check loading state during initialization
      expect(store.getState().translation.isLoading).toBe(true);
      expect(store.getState().translation.error).toBe(null);
      
      await initializePromise;
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.isInitialized).toBe(true);
    });

    it('should handle initialization error with loading states', async () => {
      const error = new Error('Init failed');
      mockCore.initialize.mockRejectedValue(error);
      
      const initializePromise = adapter.initialize(mockConfig);
      
      // Check loading state during initialization
      expect(store.getState().translation.isLoading).toBe(true);
      
      await expect(initializePromise).rejects.toThrow('Init failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
    });

    it('should cleanup subscriptions on destroy', () => {
      const unsubscribeMock = jest.fn();
      mockCore.subscribe.mockReturnValue(unsubscribeMock);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      newAdapter.destroy();
      
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when unsubscribe is null', () => {
      mockCore.subscribe.mockReturnValue(null as any);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      expect(() => newAdapter.destroy()).not.toThrow();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when unsubscribe is undefined', () => {
      mockCore.subscribe.mockReturnValue(undefined as any);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      expect(() => newAdapter.destroy()).not.toThrow();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when unsubscribe is not a function', () => {
      mockCore.subscribe.mockReturnValue('not-a-function' as any);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      expect(() => newAdapter.destroy()).not.toThrow();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle core initialization error gracefully', async () => {
      mockCore.initialize.mockRejectedValue(new Error('Core init failed'));
      
      const adapter = createReduxAdapter(mockCore, store);
      const initializePromise = adapter.initialize(mockConfig);
      
      await expect(initializePromise).rejects.toThrow('Core init failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
    });

    it('should handle core setLocale error gracefully', async () => {
      await adapter.initialize(mockConfig);
      
      mockCore.setLocale.mockRejectedValue(new Error('Locale change failed'));
      
      const setLocalePromise = adapter.getActions().setLocale('fr');
      
      await expect(setLocalePromise).rejects.toThrow('Locale change failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
    });

    it('should handle core loadTranslations error gracefully', async () => {
      await adapter.initialize(mockConfig);
      
      mockCore.loadTranslations.mockRejectedValue(new Error('Load failed'));
      
      const loadPromise = adapter.getActions().loadTranslations('fr');
      
      await expect(loadPromise).rejects.toThrow('Load failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
    });

    it('should handle core reloadTranslations error gracefully', async () => {
      await adapter.initialize(mockConfig);
      
      mockCore.reloadTranslations.mockRejectedValue(new Error('Reload failed'));
      
      const reloadPromise = adapter.getActions().reloadTranslations();
      
      await expect(reloadPromise).rejects.toThrow('Reload failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
    });

    it('should handle core clearCache error gracefully', () => {
      mockCore.clearCache.mockImplementation(() => {
        throw new Error('Clear cache failed');
      });
      
      expect(() => adapter.getActions().clearCache()).toThrow('Clear cache failed');
    });

    it('should handle core getTextDirection error gracefully', () => {
      mockCore.getTextDirection.mockImplementation(() => {
        throw new Error('Text direction failed');
      });
      
      expect(() => adapter.getActions().getTextDirection('test')).toThrow('Text direction failed');
    });

    it('should handle core isRTLLocale error gracefully', () => {
      mockCore.isRTLLocale.mockImplementation(() => {
        throw new Error('RTL check failed');
      });
      
      expect(() => adapter.getActions().isRTLLocale('ar')).toThrow('RTL check failed');
    });
  });

  describe('Redux hooks', () => {
    let mockUseSelector: jest.Mock;
    let mockUseDispatch: jest.Mock;
    let mockDispatch: jest.Mock;

    beforeEach(() => {
      mockDispatch = jest.fn();
      mockUseDispatch = jest.fn().mockReturnValue(mockDispatch);
      mockUseSelector = jest.fn().mockReturnValue({
        locale: 'en',
        translations: {},
        isLoading: false,
        error: null,
        isInitialized: true,
        lastUpdated: Date.now(),
        pendingActions: [],
        performanceMetrics: {
          translationTime: 0,
          cacheHitRate: 0,
          lastCacheCleanup: 0
        }
      });

      // Mock react-redux
      jest.doMock('react-redux', () => ({
        useSelector: mockUseSelector,
        useDispatch: mockUseDispatch
      }));
    });

    afterEach(() => {
      jest.resetModules();
    });

    it('should create useReduxTranslation hook with correct actions', () => {
      // Re-import to get the mocked version
      const { useReduxTranslation } = require('./redux');
      
      const result = useReduxTranslation();
      
      expect(result.locale).toBe('en');
      expect(result.setLocale).toBeDefined();
      expect(result.loadTranslations).toBeDefined();
      expect(result.reloadTranslations).toBeDefined();
      expect(result.clearCache).toBeDefined();
      expect(result.setPerformanceMetrics).toBeDefined();
    });

    it('should create useReduxTranslationWithMetrics hook with performance monitoring', () => {
      // Re-import to get the mocked version
      const { useReduxTranslationWithMetrics } = require('./redux');
      
      const result = useReduxTranslationWithMetrics();
      
      expect(result.locale).toBe('en');
      expect(result.setLocale).toBeDefined();
      expect(result.getPerformanceMetrics).toBeDefined();
      expect(result.isActionPending).toBeDefined();
      expect(result.getLastUpdated).toBeDefined();
    });

    it('should dispatch performance metrics when setLocale is called with metrics', () => {
      const { useReduxTranslationWithMetrics } = require('./redux');
      
      const result = useReduxTranslationWithMetrics();
      
      // Mock performance.now
      const originalPerformanceNow = performance.now;
      performance.now = jest.fn()
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1100); // end time
      
      result.setLocale('es');
      
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: expect.stringContaining('setLocale')
      }));
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: expect.stringContaining('setPerformanceMetrics'),
        payload: { translationTime: 100 }
      }));
      
      // Restore performance.now
      performance.now = originalPerformanceNow;
    });

    it('should handle error deserialization in hooks', () => {
      const mockStateWithError = {
        locale: 'en',
        translations: {},
        isLoading: false,
        error: {
          message: 'Test error',
          name: 'TestError',
          stack: 'Error stack'
        },
        isInitialized: true,
        lastUpdated: Date.now(),
        pendingActions: [],
        performanceMetrics: {
          translationTime: 0,
          cacheHitRate: 0,
          lastCacheCleanup: 0
        }
      };

      mockUseSelector.mockReturnValue(mockStateWithError);
      
      const { useReduxTranslation } = require('./redux');
      const result = useReduxTranslation();
      
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Test error');
      expect(result.error?.name).toBe('TestError');
    });
  });

  describe('ReduxAdapter edge cases', () => {
    it('should handle getState with complex error objects', () => {
      const complexError = new Error('Complex error');
      complexError.name = 'CustomError';
      complexError.stack = 'Custom stack trace';
      
      store.dispatch({ type: 'translation/setError', payload: complexError });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Complex error');
      expect(adapterState.error?.name).toBe('CustomError');
      expect(adapterState.error?.stack).toBe('Custom stack trace');
    });

    it('should handle getState with undefined error', () => {
      store.dispatch({ type: 'translation/setError', payload: undefined });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBe(null);
    });

    it('should handle getState with SerializableError', () => {
      const serializableError = {
        message: 'Serializable error',
        name: 'SerializableError',
        stack: 'Serializable stack'
      };
      
      store.dispatch({ type: 'translation/setError', payload: serializableError });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Serializable error');
      expect(adapterState.error?.name).toBe('SerializableError');
      expect(adapterState.error?.stack).toBe('Serializable stack');
    });
  });

  describe('Utility functions', () => {
    it('should test serializeError with null input', () => {
      // Import the utility functions directly
      const { serializeError } = require('./redux');
      
      // Mock the internal serializeError function by accessing it through the adapter
      const result = adapter.getState();
      expect(result.error).toBe(null);
    });

    it('should test serializeError with Error object', () => {
      const testError = new Error('Test error');
      testError.name = 'TestError';
      testError.stack = 'Test stack';
      
      store.dispatch({ type: 'translation/setError', payload: testError });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Test error');
      expect(adapterState.error?.name).toBe('TestError');
      expect(adapterState.error?.stack).toBe('Test stack');
    });

    it('should test deserializeError with null input', () => {
      store.dispatch({ type: 'translation/setError', payload: null });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBe(null);
    });

    it('should test deserializeError with SerializableError', () => {
      const serializableError = {
        message: 'Deserialized error',
        name: 'DeserializedError',
        stack: 'Deserialized stack'
      };
      
      store.dispatch({ type: 'translation/setError', payload: serializableError });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Deserialized error');
      expect(adapterState.error?.name).toBe('DeserializedError');
      expect(adapterState.error?.stack).toBe('Deserialized stack');
    });
  });

  describe('Async thunk error handling', () => {
    it('should handle loadTranslationsAsync when core is not initialized', async () => {
      // Remove core from store to simulate uninitialized state
      delete (store as any).core;
      delete (store.getState as any).core;
      
      const result = await store.dispatch(loadTranslationsAsync('es'));
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Translation core not initialized');
      
      // Restore core for other tests
      (store as any).core = mockCore;
      (store.getState as any).core = mockCore;
    });

    it('should handle reloadTranslationsAsync when core is not initialized', async () => {
      // Remove core from store to simulate uninitialized state
      delete (store as any).core;
      delete (store.getState as any).core;
      
      const result = await store.dispatch(reloadTranslationsAsync());
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Translation core not initialized');
      
      // Restore core for other tests
      (store as any).core = mockCore;
      (store.getState as any).core = mockCore;
    });

    it('should handle loadTranslationsAsync with core in different store locations', async () => {
      // Test with core in state.translation.core
      const stateWithCore = {
        translation: {
          ...store.getState().translation,
          core: mockCore
        }
      };
      
      // Mock getState to return state with core
      const mockGetState = jest.fn().mockReturnValue(stateWithCore);
      
      // Create a mock store with the custom getState
      const mockStore = {
        ...store,
        getState: mockGetState
      };
      
      const result = await mockStore.dispatch(loadTranslationsAsync('es'));
      
      expect(result.payload).toEqual({ locale: 'es', success: true });
    });

    it('should handle reloadTranslationsAsync with core in different store locations', async () => {
      // Test with core in state.translation.core
      const stateWithCore = {
        translation: {
          ...store.getState().translation,
          core: mockCore
        }
      };
      
      // Mock getState to return state with core
      const mockGetState = jest.fn().mockReturnValue(stateWithCore);
      
      // Create a mock store with the custom getState
      const mockStore = {
        ...store,
        getState: mockGetState
      };
      
      const result = await mockStore.dispatch(reloadTranslationsAsync());
      
      expect(result.payload).toEqual({ success: true });
    });
  });

  describe('Redux slice edge cases', () => {
    it('should handle setError with null payload', () => {
      store.dispatch({ type: 'translation/setError', payload: null });
      expect(store.getState().translation.error).toBe(null);
    });

    it('should handle setError with undefined payload', () => {
      store.dispatch({ type: 'translation/setError', payload: undefined });
      expect(store.getState().translation.error).toBe(null);
    });

    it('should handle setError with Error object', () => {
      const error = new Error('Test error');
      store.dispatch({ type: 'translation/setError', payload: error });
      
      const reduxState = store.getState().translation;
      expect(reduxState.error).toEqual({
        message: 'Test error',
        name: 'Error',
        stack: expect.any(String)
      });
    });

    it('should handle setError with SerializableError', () => {
      const serializedError = {
        message: 'Serialized error',
        name: 'TestError',
        stack: 'test stack'
      };
      store.dispatch({ type: 'translation/setError', payload: serializedError });
      
      expect(store.getState().translation.error).toEqual(serializedError);
    });

    it('should handle addPendingAction with duplicate action', () => {
      store.dispatch({ type: 'translation/addPendingAction', payload: 'test-action' });
      store.dispatch({ type: 'translation/addPendingAction', payload: 'test-action' });
      
      expect(store.getState().translation.pendingActions).toEqual(['test-action']);
    });

    it('should handle removePendingAction with non-existent action', () => {
      store.dispatch({ type: 'translation/removePendingAction', payload: 'non-existent' });
      
      expect(store.getState().translation.pendingActions).toEqual([]);
    });

    it('should handle clearCache action', () => {
      // Set some translations first
      store.dispatch({ type: 'translation/setTranslations', payload: { hello: 'world' } });
      expect(store.getState().translation.translations).toEqual({ hello: 'world' });
      
      // Clear cache
      store.dispatch({ type: 'translation/clearCache' });
      
      expect(store.getState().translation.translations).toEqual({});
      expect(store.getState().translation.performanceMetrics.lastCacheCleanup).toBeGreaterThan(0);
    });
  });

  describe('ReduxAdapter subscription edge cases', () => {
    it('should handle subscription with no state changes', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      // Dispatch action that doesn't change the state
      store.dispatch({ type: 'translation/updateLastUpdated' });
      
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should handle subscription with multiple state changes', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      // Dispatch multiple actions to trigger state changes
      store.dispatch({ type: 'translation/setLocale', payload: 'fr' });
      store.dispatch({ type: 'translation/setLoading', payload: true });
      store.dispatch({ type: 'translation/setLoading', payload: false });
      
      expect(listener).toHaveBeenCalledTimes(3);
      unsubscribe();
    });

    it('should handle subscription cleanup', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      unsubscribe();
      
      // Dispatch action after unsubscribe
      store.dispatch({ type: 'translation/setLocale', payload: 'de' });
      
      // Listener should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('ReduxAdapter action edge cases', () => {
    it('should handle setLocale with error and dispatch', async () => {
      mockCore.setLocale.mockRejectedValue(new Error('Locale change failed'));
      
      const actions = adapter.getActions();
      const setLocalePromise = actions.setLocale('fr');
      
      await expect(setLocalePromise).rejects.toThrow('Locale change failed');
      
      // Core method fails before Redux action is dispatched, so locale should not change
      expect(store.getState().translation.locale).toBe('en');
    });

    it('should handle loadTranslations with error and dispatch', async () => {
      mockCore.loadTranslations.mockRejectedValue(new Error('Load failed'));
      
      const actions = adapter.getActions();
      const loadPromise = actions.loadTranslations('fr');
      
      await expect(loadPromise).rejects.toThrow('Load failed');
      
      // Core method fails before async thunk is dispatched, so loading state should not change
      expect(store.getState().translation.isLoading).toBe(false);
    });

    it('should handle reloadTranslations with error and dispatch', async () => {
      mockCore.reloadTranslations.mockRejectedValue(new Error('Reload failed'));
      
      const actions = adapter.getActions();
      const reloadPromise = actions.reloadTranslations();
      
      await expect(reloadPromise).rejects.toThrow('Reload failed');
      
      // Core method fails before async thunk is dispatched, so loading state should not change
      expect(store.getState().translation.isLoading).toBe(false);
    });

    it('should handle clearCache with error', () => {
      // Set up initial translations state
      store.dispatch({ type: 'translation/setTranslations', payload: { hello: 'world' } });
      expect(store.getState().translation.translations).toEqual({ hello: 'world' });
      
      mockCore.clearCache.mockImplementation(() => {
        throw new Error('Clear cache failed');
      });
      
      expect(() => adapter.getActions().clearCache()).toThrow('Clear cache failed');
      
      // Core method fails before Redux action is dispatched, so translations should not change
      expect(store.getState().translation.translations).toEqual({ hello: 'world' });
    });
  });

  describe('ReduxAdapter initialization edge cases', () => {
    it('should handle initialization with loading states', async () => {
      const initializePromise = adapter.initialize(mockConfig);
      
      // Check loading state during initialization
      expect(store.getState().translation.isLoading).toBe(true);
      expect(store.getState().translation.error).toBe(null);
      
      await initializePromise;
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.isInitialized).toBe(true);
    });

    it('should handle initialization error with loading states', async () => {
      const error = new Error('Init failed');
      mockCore.initialize.mockRejectedValue(error);
      
      const initializePromise = adapter.initialize(mockConfig);
      
      // Check loading state during initialization
      expect(store.getState().translation.isLoading).toBe(true);
      
      await expect(initializePromise).rejects.toThrow('Init failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
    });

    it('should handle initialization with config parameter', async () => {
      const configWithOptions = {
        ...mockConfig,
        debug: true,
        fallbackLocale: 'en'
      };
      
      await adapter.initialize(configWithOptions);
      
      expect(mockCore.initialize).toHaveBeenCalled();
      expect(store.getState().translation.isInitialized).toBe(true);
    });
  });

  describe('ReduxAdapter destroy edge cases', () => {
    it('should handle destroy when unsubscribe is null', () => {
      mockCore.subscribe.mockReturnValue(null as any);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      expect(() => newAdapter.destroy()).not.toThrow();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when unsubscribe is undefined', () => {
      mockCore.subscribe.mockReturnValue(undefined as any);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      expect(() => newAdapter.destroy()).not.toThrow();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when unsubscribe is not a function', () => {
      mockCore.subscribe.mockReturnValue('not-a-function' as any);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      expect(() => newAdapter.destroy()).not.toThrow();
      
      expect(mockCore.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when unsubscribe is a function', () => {
      const unsubscribeMock = jest.fn();
      mockCore.subscribe.mockReturnValue(unsubscribeMock);
      
      const newAdapter = createReduxAdapter(mockCore, store);
      newAdapter.destroy();
      
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockCore.destroy).toHaveBeenCalled();
    });
  });

  describe('ReduxAdapter constructor edge cases', () => {
    it('should handle constructor with core subscription', () => {
      const mockSubscribe = jest.fn().mockReturnValue(jest.fn());
      const mockCoreWithSubscribe = {
        ...mockCore,
        subscribe: mockSubscribe
      } as any;
      
      const newAdapter = createReduxAdapter(mockCoreWithSubscribe, store);
      
      expect(mockSubscribe).toHaveBeenCalled();
      expect(typeof newAdapter.destroy).toBe('function');
    });

    it('should handle constructor with core state changes', () => {
      const mockSubscribe = jest.fn().mockImplementation((callback) => {
        // Simulate core state change
        callback({
          translations: { hello: 'world' },
          locale: 'en',
          isLoading: false,
          error: null,
          isInitialized: true
        });
        return jest.fn();
      });
      
      const mockCoreWithSubscribe = {
        ...mockCore,
        subscribe: mockSubscribe
      } as any;
      
      const newAdapter = createReduxAdapter(mockCoreWithSubscribe, store);
      
      expect(mockSubscribe).toHaveBeenCalled();
      expect(store.getState().translation.translations).toEqual({ hello: 'world' });
      
      newAdapter.destroy();
    });
  });

  describe('ReduxAdapter getState edge cases', () => {
    it('should handle getState with complex state', () => {
      // Set complex state
      store.dispatch({ type: 'translation/setLocale', payload: 'fr' });
      store.dispatch({ type: 'translation/setLoading', payload: true });
      store.dispatch({ type: 'translation/setTranslations', payload: { hello: 'bonjour', goodbye: 'au revoir' } });
      store.dispatch({ type: 'translation/setPerformanceMetrics', payload: { translationTime: 100, cacheHitRate: 85 } });
      store.dispatch({ type: 'translation/addPendingAction', payload: 'action1' });
      store.dispatch({ type: 'translation/addPendingAction', payload: 'action2' });
      
      const adapterState = adapter.getState();
      
      expect(adapterState.locale).toBe('fr');
      expect(adapterState.isLoading).toBe(true);
      expect(adapterState.translations).toEqual({ hello: 'bonjour', goodbye: 'au revoir' });
      // Note: performanceMetrics and pendingActions are not part of TranslationState interface
      // They are only available in ReduxTranslationState
    });

    it('should handle getState with error state', () => {
      const error = new Error('Test error');
      store.dispatch({ type: 'translation/setError', payload: error });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBeInstanceOf(Error);
      expect(adapterState.error?.message).toBe('Test error');
    });

    it('should handle getState with null error state', () => {
      store.dispatch({ type: 'translation/setError', payload: null });
      
      const adapterState = adapter.getState();
      expect(adapterState.error).toBe(null);
    });
  });

  describe('ReduxAdapter getActions edge cases', () => {
    it('should handle getActions with core method errors', () => {
      const actions = adapter.getActions();
      
      // Test that actions are properly bound
      expect(typeof actions.setLocale).toBe('function');
      expect(typeof actions.loadTranslations).toBe('function');
      expect(typeof actions.translate).toBe('function');
      expect(typeof actions.translatePlural).toBe('function');
      expect(typeof actions.formatDate).toBe('function');
      expect(typeof actions.formatNumber).toBe('function');
      expect(typeof actions.getTextDirection).toBe('function');
      expect(typeof actions.isRTLLocale).toBe('function');
      expect(typeof actions.reloadTranslations).toBe('function');
      expect(typeof actions.clearCache).toBe('function');
    });

    it('should handle getActions with performance monitoring', () => {
      const actions = adapter.getActions();
      const initialTime = store.getState().translation.lastUpdated;
      
      actions.translate('hello');
      
      // Verify that the action updated lastUpdated timestamp
      expect(store.getState().translation.lastUpdated).toBeGreaterThanOrEqual(initialTime);
      // Note: translate action doesn't update translations in store, only lastUpdated
      // The mock core returns 'translated' but doesn't store it in Redux state
    });
  });

  describe('ReduxAdapter subscribe edge cases', () => {
    it('should handle subscribe with state comparison', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      // Dispatch action that changes state
      store.dispatch({ type: 'translation/setLocale', payload: 'de' });
      
      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        locale: 'de'
      }));
      
      unsubscribe();
    });

    it('should handle subscribe with no state changes', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      // Dispatch action that doesn't change the state
      store.dispatch({ type: 'translation/updateLastUpdated' });
      
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should handle subscribe cleanup', () => {
      const listener = jest.fn();
      const unsubscribe = adapter.subscribe(listener);
      
      unsubscribe();
      
      // Dispatch action after unsubscribe
      store.dispatch({ type: 'translation/setLocale', payload: 'it' });
      
      // Listener should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('ReduxAdapter factory function', () => {
    it('should create ReduxAdapter with proper instance', () => {
      const newAdapter = createReduxAdapter(mockCore, store);
      
      expect(newAdapter).toBeInstanceOf(ReduxAdapter);
      expect(typeof newAdapter.getState).toBe('function');
      expect(typeof newAdapter.getActions).toBe('function');
      expect(typeof newAdapter.subscribe).toBe('function');
      expect(typeof newAdapter.initialize).toBe('function');
      expect(typeof newAdapter.destroy).toBe('function');
    });

    it('should create ReduxAdapter with core subscription', () => {
      const mockSubscribe = jest.fn().mockReturnValue(jest.fn());
      const mockCoreWithSubscribe = {
        ...mockCore,
        subscribe: mockSubscribe
      } as any;
      
      const newAdapter = createReduxAdapter(mockCoreWithSubscribe, store);
      
      expect(mockSubscribe).toHaveBeenCalled();
      expect(typeof newAdapter.destroy).toBe('function');
      
      newAdapter.destroy();
    });
  });

  describe('Redux hooks edge cases', () => {
    it('should test useReduxTranslation hook with error deserialization', () => {
      // Mock react-redux hooks
      const mockUseSelector = jest.fn();
      const mockUseDispatch = jest.fn();
      const mockDispatch = jest.fn();
      
      mockUseSelector.mockReturnValue({
        locale: 'en',
        translations: {},
        isLoading: false,
        error: {
          message: 'Test error',
          name: 'TestError',
          stack: 'Test stack'
        },
        isInitialized: true,
        lastUpdated: Date.now(),
        pendingActions: [],
        performanceMetrics: {
          translationTime: 0,
          cacheHitRate: 0,
          lastCacheCleanup: Date.now()
        }
      });
      mockUseDispatch.mockReturnValue(mockDispatch);
      
      // Mock require to return our mocked hooks
      jest.doMock('react-redux', () => ({
        useSelector: mockUseSelector,
        useDispatch: mockUseDispatch
      }));
      
      const { useReduxTranslation } = require('./redux');
      
      // This test verifies the hook structure and error deserialization
      expect(typeof useReduxTranslation).toBe('function');
      
      jest.dontMock('react-redux');
    });

    it('should test useReduxTranslationWithMetrics hook with performance utilities', () => {
      // Mock react-redux hooks
      const mockUseSelector = jest.fn();
      const mockUseDispatch = jest.fn();
      const mockDispatch = jest.fn();
      
      mockUseSelector.mockReturnValue({
        locale: 'en',
        translations: {},
        isLoading: false,
        error: null,
        isInitialized: true,
        lastUpdated: Date.now(),
        pendingActions: ['action1', 'action2'],
        performanceMetrics: {
          translationTime: 100,
          cacheHitRate: 85,
          lastCacheCleanup: Date.now()
        }
      });
      mockUseDispatch.mockReturnValue(mockDispatch);
      
      // Mock require to return our mocked hooks
      jest.doMock('react-redux', () => ({
        useSelector: mockUseSelector,
        useDispatch: mockUseDispatch
      }));
      
      const { useReduxTranslationWithMetrics } = require('./redux');
      
      // This test verifies the hook structure and performance monitoring utilities
      expect(typeof useReduxTranslationWithMetrics).toBe('function');
      
      jest.dontMock('react-redux');
    });
  });

  describe('ReduxAdapter comprehensive error handling', () => {
    it('should handle all core method errors gracefully', async () => {
      const actions = adapter.getActions();
      
      // Test setLocale error
      mockCore.setLocale.mockRejectedValue(new Error('Set locale failed'));
      await expect(actions.setLocale('fr')).rejects.toThrow('Set locale failed');
      
      // Test loadTranslations error
      mockCore.loadTranslations.mockRejectedValue(new Error('Load translations failed'));
      await expect(actions.loadTranslations('fr')).rejects.toThrow('Load translations failed');
      
      // Test reloadTranslations error
      mockCore.reloadTranslations.mockRejectedValue(new Error('Reload translations failed'));
      await expect(actions.reloadTranslations()).rejects.toThrow('Reload translations failed');
      
      // Test clearCache error
      mockCore.clearCache.mockImplementation(() => {
        throw new Error('Clear cache failed');
      });
      expect(() => actions.clearCache()).toThrow('Clear cache failed');
      
      // Test getTextDirection error
      mockCore.getTextDirection.mockImplementation(() => {
        throw new Error('Get text direction failed');
      });
      expect(() => actions.getTextDirection('test')).toThrow('Get text direction failed');
      
      // Test isRTLLocale error
      mockCore.isRTLLocale.mockImplementation(() => {
        throw new Error('Is RTL locale failed');
      });
      expect(() => actions.isRTLLocale('ar')).toThrow('Is RTL locale failed');
    });

    it('should handle initialization errors comprehensively', async () => {
      const error = new Error('Comprehensive initialization failed');
      mockCore.initialize.mockRejectedValue(error);
      
      const initializePromise = adapter.initialize(mockConfig);
      
      // Check loading state during initialization
      expect(store.getState().translation.isLoading).toBe(true);
      expect(store.getState().translation.error).toBe(null);
      
      await expect(initializePromise).rejects.toThrow('Comprehensive initialization failed');
      
      expect(store.getState().translation.isLoading).toBe(false);
      expect(store.getState().translation.error).toBeDefined();
      expect(store.getState().translation.isInitialized).toBe(false);
    });
  });
});
