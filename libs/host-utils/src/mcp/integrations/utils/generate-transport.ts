export default function generateTransport({ remixId }: { remixId: string }) {
  return {
    command: 'npx',
    args: ['-y', '@openmcp/cli@latest', 'run', '--server', remixId],
  } as const;
}
