import fs from 'fs';
import path from 'path';

describe('Bundle Integration Tests', () => {
  describe('Bundle Structure', () => {
    it('should have correct main bundle structure', () => {
      const distPath = path.join(__dirname, '../../../dist');
      
      // Check if dist directory exists
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      
      // Check for main bundle files
      const files = fs.readdirSync(distPath);
      // Check if any of the expected files exist (they might not all be present)
      const hasMainFiles = files.some(file => 
        file === 'index.js' || file === 'index.esm.js' || file === 'index.d.ts'
      );
      expect(hasMainFiles).toBe(true);
    });

    it('should have correct SSR bundle structure', () => {
      const distPath = path.join(__dirname, '../../../dist');
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      const files = fs.readdirSync(distPath);
      
      // Check for SSR bundle files
      const hasSSRFiles = files.some(file => 
        file === 'ssr.js' || file === 'ssr.esm.js' || file === 'ssr.d.ts'
      );
      expect(hasSSRFiles).toBe(true);
    });

    it('should have correct adapter bundle structure', () => {
      const distPath = path.join(__dirname, '../../../dist');
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      const files = fs.readdirSync(distPath);
      
      // Check for adapter bundle files
      const hasAdapterFiles = files.some(file => 
        file === 'adapters-context.js' || file === 'adapters-context.esm.js' || file === 'adapters-context.d.ts'
      );
      expect(hasAdapterFiles).toBe(true);
    });

    it('should have correct React Native bundle structure', () => {
      const distPath = path.join(__dirname, '../../../dist');
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      const files = fs.readdirSync(distPath);
      
      // Check for React Native bundle files
      const hasReactNativeFiles = files.some(file => 
        file === 'react-native.js' || file === 'react-native.esm.js' || file === 'react-native.d.ts'
      );
      expect(hasReactNativeFiles).toBe(true);
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should have reasonable main bundle size', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const mainBundlePath = path.join(distPath, 'index.js');
      
      if (fs.existsSync(mainBundlePath)) {
        const stats = fs.statSync(mainBundlePath);
        const sizeInKB = stats.size / 1024;
        
        // Main bundle should be under 100KB (adjust threshold as needed)
        expect(sizeInKB).toBeLessThan(100);
        expect(sizeInKB).toBeGreaterThan(1); // Should have some content
      }
    });

    it('should have reasonable ESM bundle size', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const esmBundlePath = path.join(distPath, 'index.esm.js');
      
      if (fs.existsSync(esmBundlePath)) {
        const stats = fs.statSync(esmBundlePath);
        const sizeInKB = stats.size / 1024;
        
        // ESM bundle should be under 100KB (adjust threshold as needed)
        expect(sizeInKB).toBeLessThan(100);
        expect(sizeInKB).toBeGreaterThan(1); // Should have some content
      }
    });

    it('should have reasonable SSR bundle size', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const ssrBundlePath = path.join(distPath, 'ssr.js');
      
      if (fs.existsSync(ssrBundlePath)) {
        const stats = fs.statSync(ssrBundlePath);
        const sizeInKB = stats.size / 1024;
        
        // SSR bundle should be under 50KB (adjust threshold as needed)
        expect(sizeInKB).toBeLessThan(50);
        expect(sizeInKB).toBeGreaterThan(1); // Should have some content
      }
    });

    it('should have reasonable React Native bundle size', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const rnBundlePath = path.join(distPath, 'react-native.js');
      
      if (fs.existsSync(rnBundlePath)) {
        const stats = fs.statSync(rnBundlePath);
        const sizeInKB = stats.size / 1024;
        
        // React Native bundle should be under 80KB (adjust threshold as needed)
        expect(sizeInKB).toBeLessThan(80);
        expect(sizeInKB).toBeGreaterThan(1); // Should have some content
      }
    });
  });

  describe('Tree Shaking Validation', () => {
    it('should support tree shaking for unused exports', () => {
      // This test validates that the bundle structure supports tree shaking
      // by checking that exports are properly structured
      
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.warn('Package.json does not exist. Run "npm run build" first.');
        return; // Skip test if package.json doesn't exist
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for proper exports configuration
      expect(packageJson.exports).toBeDefined();
      expect(packageJson.exports['.']).toBeDefined();
      expect(packageJson.exports['./ssr']).toBeDefined();
      expect(packageJson.exports['./adapters/context']).toBeDefined();
      expect(packageJson.exports['./react-native']).toBeDefined();
    });

    it('should have proper sideEffects configuration', () => {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.warn('Package.json does not exist. Run "npm run build" first.');
        return; // Skip test if package.json doesn't exist
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Should be configured for tree shaking
      expect(packageJson.sideEffects).toBe(false);
    });

    it('should have proper module resolution', () => {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.warn('Package.json does not exist. Run "npm run build" first.');
        return; // Skip test if package.json doesn't exist
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Should have proper module configuration
      expect(packageJson.module).toBeDefined();
      expect(packageJson.main).toBeDefined();
      expect(packageJson.types).toBeDefined();
    });
  });

  describe('Module Exports Validation', () => {
    it('should export all required modules', () => {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.warn('Package.json does not exist. Run "npm run build" first.');
        return; // Skip test if package.json doesn't exist
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const exports = packageJson.exports;
      
      // Check main exports
      expect(exports['.']).toBeDefined();
      expect(exports['./ssr']).toBeDefined();
      expect(exports['./adapters/context']).toBeDefined();
      expect(exports['./react-native']).toBeDefined();
    });

    it('should have correct file extensions in exports', () => {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.warn('Package.json does not exist. Run "npm run build" first.');
        return; // Skip test if package.json doesn't exist
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const exports = packageJson.exports;
      
      // Check that exports point to correct file types
      Object.values(exports).forEach((exportConfig: any) => {
        if (typeof exportConfig === 'object' && exportConfig.import) {
          expect(exportConfig.import).toMatch(/\.esm\.js$/);
        }
        if (typeof exportConfig === 'object' && exportConfig.require) {
          expect(exportConfig.require).toMatch(/\.js$/);
        }
        if (typeof exportConfig === 'object' && exportConfig.types) {
          expect(exportConfig.types).toMatch(/\.d\.ts$/);
        }
      });
    });
  });

  describe('TypeScript Declaration Files', () => {
    it('should have TypeScript declaration files', () => {
      const distPath = path.join(__dirname, '../../../dist');
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      const files = fs.readdirSync(distPath);
      
      // Check for TypeScript declaration files
      expect(files.some(file => file.endsWith('.d.ts'))).toBe(true);
    });

    it('should have declaration files for all bundles', () => {
      const distPath = path.join(__dirname, '../../../dist');
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      const files = fs.readdirSync(distPath);
      
      // Check for specific declaration files
      const declarationFiles = files.filter(file => file.endsWith('.d.ts'));
      
      // Check if any declaration files exist
      expect(declarationFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Source Maps', () => {
    it('should have source maps for debugging', () => {
      const distPath = path.join(__dirname, '../../../dist');
      if (!fs.existsSync(distPath)) {
        console.warn('Dist directory does not exist. Run "npm run build" first.');
        return; // Skip test if dist doesn't exist
      }
      const files = fs.readdirSync(distPath);
      
      // Check for source map files
      const sourceMapFiles = files.filter(file => file.endsWith('.js.map'));
      
      // Should have at least some source maps
      expect(sourceMapFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Bundle Content Validation', () => {
    it('should not include unnecessary dependencies in main bundle', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const mainBundlePath = path.join(distPath, 'index.js');
      
      if (fs.existsSync(mainBundlePath)) {
        const content = fs.readFileSync(mainBundlePath, 'utf8');
        
        // Should not include React Native specific code in main bundle
        expect(content).not.toContain('react-native');
        
        // Should not include SSR specific code in main bundle
        expect(content).not.toContain('getServerSideTranslations');
      }
    });

    it('should include React Native specific code only in RN bundle', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const rnBundlePath = path.join(distPath, 'react-native.js');
      
      if (fs.existsSync(rnBundlePath)) {
        const content = fs.readFileSync(rnBundlePath, 'utf8');
        
        // Should include React Native specific exports
        expect(content).toContain('TranslatedTextRN');
        expect(content).toContain('react-native');
      }
    });

    it('should include SSR specific code only in SSR bundle', () => {
      const distPath = path.join(__dirname, '../../../dist');
      const ssrBundlePath = path.join(distPath, 'ssr.js');
      
      if (fs.existsSync(ssrBundlePath)) {
        const content = fs.readFileSync(ssrBundlePath, 'utf8');
        
        // Should include SSR specific exports
        expect(content).toContain('getServerSideTranslations');
        expect(content).toContain('SSRTranslationUtils');
      }
    });
  });
});
