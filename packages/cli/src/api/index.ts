// API exposed by CLI
// must be environment independent - the members exported here must not use Node.js specific APIs
export { getInstallHints, type IntegrationName } from '../libs/mcp-clients/index.isomorphic.ts';
