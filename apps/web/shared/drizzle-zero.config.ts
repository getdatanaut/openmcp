import * as drizzleSchema from '@libs/db-pg/schema';
import { drizzleZeroConfig } from 'drizzle-zero';

/**
 * This config drives the zero-schema.gen.ts file.
 *
 * If anything in this file is changed, run `yarn workspace web generate.zero-schema` to regenerate the zero-schema.gen.ts file.
 */
export default drizzleZeroConfig(
  {
    agentMcpServers: drizzleSchema.agentMcpServers,
    agentMcpServersRelations: drizzleSchema.agentMcpServersRelations,
    agentMcpTools: drizzleSchema.agentMcpTools,
    agentMcpToolsRelations: drizzleSchema.agentMcpToolsRelations,
    agents: drizzleSchema.agents,
    agentsRelations: drizzleSchema.agentsRelations,
    mcpServers: drizzleSchema.mcpServers,
    mcpServersRelations: drizzleSchema.mcpServersRelations,
    mcpTools: drizzleSchema.mcpTools,
    mcpToolsRelations: drizzleSchema.mcpToolsRelations,
    users: drizzleSchema.users,
  },
  {
    // Specify which tables and columns to include in the Zero schema.
    // This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
    // When a column is first added, it should be set to false, and then changed to true
    // once the migration has been run.

    // All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
    // Column names match your Drizzle schema definitions
    tables: {
      agentMcpServers: {
        id: true,
        agentId: true,
        mcpServerId: true,
        userId: true,
        configJson: true,
      },
      agentMcpTools: {
        id: true,
        agentId: true,
        mcpServerId: true,
        mcpToolId: true,
      },
      agents: {
        id: true,
        name: true,
        instructions: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
      mcpServers: {
        id: true,
        externalId: true,
        name: true,
        summary: true,
        description: true,
        instructions: true,
        iconUrl: true,
        developer: true,
        developerUrl: true,
        sourceUrl: true,
        configSchemaJson: true,
        transportJson: true,
        runsRemote: true,
        runsLocal: true,
        userId: true,
        toolCount: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
      mcpTools: {
        id: true,
        name: true,
        displayName: true,
        summary: true,
        description: true,
        instructions: true,
        inputSchemaJson: true,
        outputSchemaJson: true,
        isReadonly: true,
        isDestructive: true,
        isIdempotent: true,
        isOpenWorld: true,
        mcpServerId: true,
        createdAt: true,
        updatedAt: true,
      },
      users: {
        id: true,
        name: true,
        image: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  },
);
