# @openmcp/cli Development Guide

This document provides guidelines and instructions for developing the `@openmcp/cli` package.

## Overview

`@openmcp/cli` is a command-line interface tool for OpenMCP that provides various commands for interacting with the OpenMCP ecosystem. It uses [yargs](https://yargs.js.org/) for command-line argument parsing and [consola](https://github.com/unjs/consola) for logging.

## Project Structure

```
packages/cli/
├── bin/                  # Entry point for the CLI
├── src/
│   ├── commands/         # Command implementations
│   │   ├── login/        # Login command
│   │   ├── logout/       # Logout command
│   │   ├── run/          # Run command
│   │   └── upload/       # Upload command
│   ├── consola/          # Logging utilities
│   ├── libs/             # Shared libraries
│   ├── register.ts       # Yargs (CLI / Command) registration
│   └── index.ts          # Main exports for programmatic usage
├── package.json          # Package configuration
└── DEVELOPMENT.md        # This file
```

## Commands

The CLI currently supports the following commands:

1. **login**: Authenticates the user by opening a login page in the browser.
2. **logout**: Logs out the currently authenticated user.
3. **run**: Starts a new server using a configuration file or server parameters.
4. **upload**: Uploads an MCP (Model Context Protocol) server of various types (stdio, sse, streamable-http, openapi).

## Development Workflow

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/getdatanaut/openmcp.git
   cd openmcp
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

### Running the CLI during development

There are two convenient ways to the CLI during development.
`NODE_ENV` can be either set to `development` if you want CLI to use the local server, or kept undefined if you wish to use the production server.

#### Using openmcp bin

```bash
NODE_ENV=development TS_NODE_PROJECT=$(pwd)/packages/cli/tsconfig.json NODE_OPTIONS="--conditions=development --loader ts-node/esm" openmcp login
```

or, if you do not intend to use any other Node.js process in a given session, you can export env variables like so:

```bash
export NODE_OPTIONS="--conditions=development --loader ts-node/esm" TS_NODE_PROJECT=$(pwd)/packages/cli/tsconfig.json NODE_ENV=development

# run any command
openmcp --help
openmcp login
```

#### Using "exec" npm script 

```bash
yarn workspace @openmcp/cli run exec <command> [options]
yarn workspace @openmcp/cli run exec --help # to get a list of all public commands
```

For example:

```bash
yarn workspace @openmcp/cli run exec login
yarn workspace @openmcp/cli run exec logout
yarn workspace @openmcp/cli run exec run
yarn workspace @openmcp/cli run exec upload --type=stdio -- "px -y @modelcontextprotocol/server-filesystem /Users/jakub/Desktop"
```

Note that the current working directory is set to `packages/cli` in this case.

### Adding a New Command

To add a new command to the CLI:

1. Create a new directory in `src/commands/` for your command.
2. Create an `index.ts` file that exports a yargs CommandModule.
3. For complex commands, separate the command definition from the implementation by creating a `handler.ts` file.
4. Register your command in `src/register.ts`.

Example command structure:

```typescript
// src/commands/mycommand/index.ts
import type { CommandModule } from 'yargs';
import handler from './handler.ts';

export default {
  command: 'mycommand',
  describe: 'Description of my command',
  builder: (yargs) => yargs.options({
    // Define command options here
  }),
  handler,
} satisfies CommandModule;
```

```typescript
// src/commands/mycommand/handler.ts
export default async function handler(args: any): Promise<void> {
  // Implement command logic here
}
```

Then register the command in `src/register.ts`:

```typescript
import myCommand from './commands/mycommand/index.ts';

// In the register function:
.command(myCommand)
```

## Testing

The CLI uses [vitest](https://vitest.dev/) for testing. You can run tests with:

```bash
yarn workspace @openmcp/cli test
```

Or watch for changes:

```bash
yarn workspace @openmcp/cli test.watch
```

When writing tests for commands, you can mock dependencies and test the command handlers directly.

## Linting and Type Checking

The CLI uses ESLint for linting and TypeScript for type checking. You can run these checks with:

```bash
yarn workspace @openmcp/cli lint
yarn workspace @openmcp/cli typecheck
```

## Building for Production

To build the CLI for production:

```bash
yarn workspace @openmcp/cli build
```

This will create a distribution in the `dist/` directory.

## Dependencies

The CLI has several key dependencies:

- **yargs**: For command-line argument parsing
- **consola**: For logging
- **@modelcontextprotocol/sdk**: For Model Context Protocol support
- **@openmcp/remix**: For Remix server support
- **@openmcp/openapi**: For OpenAPI support

## Contributing

When contributing to the CLI, please follow these guidelines:

1. Follow the existing code style and structure.
2. Write tests for new functionality.
3. Update documentation when adding or changing features.
4. Run linting and type checking before submitting changes.
5. Make sure all tests pass.

## Troubleshooting

If you encounter issues during development:

1. Make sure all dependencies are installed.
2. Check that you're using the correct Node.js version.
3. Try cleaning and rebuilding the project.
4. Check the logs for error messages.
5. Verify that exports in index.ts are pointing to the correct files (there was a previous bug where both run and upload commands were importing from the run command's file).

## Resources

- [yargs Documentation](https://yargs.js.org/)
- [consola Documentation](https://github.com/unjs/consola)
- [Model Context Protocol Documentation](https://modelcontextprotocol.ai/)
