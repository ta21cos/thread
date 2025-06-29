# Thread - Desktop App with Electron

This document explains how to run and build the Thread application as a native Mac desktop app using Electron.

## Development

### Prerequisites
- Node.js and npm installed
- All project dependencies installed (`npm install`)

### Running in Development Mode

```bash
npm run electron-dev
```

This command will:
1. Start the Next.js development server
2. Wait for the server to be ready
3. Launch the Electron app pointing to the development server

The app will open in a native desktop window with:
- Full desktop app experience
- Hot reloading from Next.js
- Developer tools available
- Native macOS menu bar integration

### Available Scripts

- `npm run electron-dev` - Start development mode with hot reloading
- `npm run electron` - Run Electron pointing to localhost:3000 (requires dev server to be running)
- `npm run build:electron` - Build production app bundle
- `npm run dist` - Build distributable packages (DMG, ZIP for Mac)

## Building for Production

### Build Application Bundle

```bash
npm run build:electron
```

This creates a complete application bundle ready for distribution.

### Create Distributable Packages

```bash
npm run dist
```

This creates:
- `dist/Thread-X.X.X.dmg` - macOS installer
- `dist/Thread-X.X.X-mac.zip` - macOS app bundle

## Features

### Native Desktop Experience
- Native macOS window controls
- System menu bar integration  
- Dock integration
- System notifications support (ready for implementation)

### Security
- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for controlled API access
- External link protection (opens in default browser)

### Cross-Platform Support
- Configured for macOS (primary target)
- Windows and Linux build targets available
- Universal binary support (Intel and Apple Silicon)

## File Structure

```
electron/
├── main.js          # Main Electron process
└── preload.js       # Secure preload script

public/
├── electron.js      # Production main process (copied from electron/main.js)
├── preload.js       # Production preload script
└── icons/           # App icons directory
```

## Configuration

### Electron Builder
Configuration in `package.json` under the `build` section:
- macOS: Creates DMG and ZIP packages
- Universal binary support (Intel + Apple Silicon)
- Productivity app category
- Custom bundle ID: `com.thread.app`

### Next.js
- Static export mode for production builds
- Image optimization disabled (required for Electron)
- Trailing slashes enabled for better file serving

## Known Limitations

### Server Actions in Static Export
Since the production build uses Next.js static export, Server Actions won't work. You'll need to:
1. Replace Server Actions with API routes for production, or
2. Run a local server within Electron, or
3. Use development mode for full functionality

### Database in Desktop App
The current setup connects to Supabase, which requires internet connectivity. For offline functionality, consider:
- Local SQLite database
- Sync mechanism between local and remote data
- Offline-first architecture

## Customization

### App Icon
Place your app icons in `public/icons/`:
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon  
- `icon.png` - Linux/fallback icon

Uncomment the icon line in `public/electron.js` when icons are available.

### Menu Customization
Edit the `createMenu()` function in `public/electron.js` to customize:
- Application menu items
- Keyboard shortcuts
- Menu actions

### Window Behavior
Modify window creation in `public/electron.js`:
- Default size and minimum size
- Title bar style
- Window positioning
- Show/hide behavior

## Troubleshooting

### Port Already in Use
If port 3000 is busy, Next.js will automatically use port 3001. Update the Electron main process if needed.

### DevTools Warnings
Console warnings about Autofill are normal and don't affect functionality.

### Build Failures
Ensure all dependencies are installed and try:
```bash
npm clean-install
npm run build:electron
```

## Future Enhancements

### Auto-Updates
Implement `electron-updater` for automatic app updates:
```bash
npm install electron-updater
```

### Native Notifications
Use the preload script to expose notification APIs to the renderer process.

### Deep Linking
Configure custom URL scheme for opening Thread links from other apps.

### Menu Bar App
Consider creating a menu bar version for quick access.