# Host Utils

A utility library for platform-specific operations and MCP (Model Control Protocol) host integrations.

## Overview

This library provides utilities for:

1. Platform detection and platform-specific paths
2. Installing and uninstalling "remixes" across different host environments
3. Integration with various code editors and tools (VSCode, Cursor, etc.)

## Usage

### Constants

```typescript
import * as constants from '@openmcp/host-utils';

// Access platform-specific paths
const { homedir, configdir } = constants;
```

### MCP Integrations

```typescript
import { install, uninstall, integrations } from '@openmcp/host-utils/mcp';

// Install a remix for VSCode
await install(logger, 'vscode', { id: 'remix-id', name: 'My Remix' });

// Uninstall a remix
await uninstall(logger, 'vscode', { id: 'remix-id', name: 'My Remix' });

// Get available integrations
const availableIntegrations = Object.keys(integrations);
```

## API Reference

### Core Exports

- `constants`: Platform-specific constants (homedir, configdir)

### MCP Module

- `install(logger, integrationName, remix)`: Install a remix for a specific integration
- `uninstall(logger, integrationName, remix)`: Uninstall a remix from a specific integration
- `integrations`: Object containing all available integration clients
- Types:
  - `IntegrationName`: Union type of all supported integration names
  - `Logger`: Interface for logging operations
  - `McpHostClient`: Interface for host client implementations

### Supported Integrations

- `vscode`: Visual Studio Code
- `vscode-insiders`: Visual Studio Code Insiders
- `claude`: Claude Desktop
- `cline`: Claude Dev extension for VSCode
- `windsurf`: Windsurf
- `roocode`: Roo Cline extension
- `boltai`: Bolt AI
- `witsy`: Witsy
- `cursor`: Cursor editor
