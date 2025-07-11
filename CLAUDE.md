# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Tabr**, a Chrome Extension that replaces the default new tab page with beautiful, dynamic background images from Unsplash API. Built with React 18 + TypeScript + Tailwind CSS using Vite as the build tool.

## Essential Development Commands

```bash
# Build the extension (required after any code changes)
npm run build

# Watch mode - automatically rebuilds on file changes
npm run build:watch

# Component preview mode - for UI development
npm run dev

# Package for release
npm run package
```

**Critical**: Chrome extensions require building before testing. Always run `npm run build` after code changes, then reload the extension in Chrome.

## Architecture Overview

### Core Components Structure
- **`src/newtab.tsx`** (300+ lines): Main application component containing all UI logic, state management, and API integration
- **`src/components/Clock.tsx`**: Time display with intelligent Chinese/English greetings
- **`src/components/SettingsMenu.tsx`**: Settings modal for API key configuration
- **`src/api/`**: Photo fetching and caching system
  - `fetchUnsplashPhoto.ts`: Unsplash API integration
  - `photoCache.ts`: Multi-layer caching strategy

### Advanced Caching System
The project implements a sophisticated 3-layer caching strategy:
1. **API Cache**: 2-minute cache for immediate page loads
2. **Preload Cache**: Background preloading of next images
3. **Favorites Cache**: User-favorited images stored in Chrome storage

### Key Features
- **Dynamic Background Rotation**: Carousel mode rotates through favorites every 2 minutes
- **Smart Photo Selection**: Filters for landscape orientation and appropriate sizing
- **Intelligent Preloading**: Background loading for smooth user experience
- **Fallback System**: Graceful degradation when APIs are unavailable

## Development Workflow

1. **Code Changes**: Edit React components or styles
2. **Build**: Run `npm run build` (or use `npm run build:watch`)
3. **Reload Extension**: In Chrome Extensions page, click reload button for "Tabr - Beautiful New Tab (Dev)"
4. **Test**: Open new tab to see changes

For UI development, use `npm run dev` for faster iteration, then test in actual extension.

## Configuration Files

- **`manifest.json`**: Chrome Extension Manifest V3 configuration
- **`vite.config.ts`**: Vite build setup with React plugin and path aliases
- **`scripts/fix-paths.js`**: Post-build script that fixes asset paths for extension environment
- **`tailwind.config.js`**: Tailwind CSS configuration

## API Integration

The extension integrates with Unsplash API:
- **Unsplash**: Requires access key configuration in `fetchUnsplashPhoto.ts`

The API has fallback images when unavailable. The extension gracefully handles API failures and network issues.

## Chrome Extension Specifics

- **Manifest V3**: Uses latest Chrome Extension format
- **Permissions**: Requires storage access and host permissions for photo APIs
- **New Tab Override**: Replaces Chrome's default new tab page
- **No Background Scripts**: Uses content scripts only for better performance

## Build Process

1. **Vite Build**: Compiles TypeScript, bundles React, processes Tailwind CSS
2. **Path Fixing**: `scripts/fix-paths.js` adjusts asset paths for extension environment
3. **Output**: `dist/` directory contains the built extension ready for Chrome

## Testing Strategy

- **Component Testing**: Use `npm run dev` for isolated component development
- **Extension Testing**: Load unpacked extension in Chrome for full integration testing
- **API Testing**: Verify photo fetching and caching behavior
- **Error Handling**: Test fallback scenarios when APIs are unavailable