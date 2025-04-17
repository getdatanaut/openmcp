import { describe, expect, it } from 'vitest';

import parseCmd from '../index.ts';
import ParsedCommand from '../parsed-command.ts';

describe('parseCmd', () => {
  describe('environment variables', () => {
    it('should parse environment variables', () => {
      const result = parseCmd('VAR1=value1 VAR2=value2 generic command');

      expect(result).toBeInstanceOf(ParsedCommand);
      expect(result.configSchema).toBeDefined();
      expect(result.externalId).toBe('generic-command');

      expect(result.getTransportConfig()).toStrictEqual({
        command: 'generic',
        type: 'stdio',
        env: {
          VAR1: 'value1',
          VAR2: 'value2',
        },
        args: ['command'],
      });
      expect(result.configSchema.serialize()).toStrictEqual({
        type: 'object',
        properties: {
          VAR1: {
            type: 'string',
          },
          VAR2: {
            type: 'string',
          },
        },
        required: ['VAR1', 'VAR2'],
      });

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'generic',
          args: ['command'],
          cwd,
          env: expect.objectContaining({
            VAR1: 'value1',
            VAR2: 'value2',
          }),
        }),
      );
    });

    it('should handle quoted environment variable values', () => {
      const result = parseCmd('VAR1="quoted value" generic command');

      expect(result.externalId).toBe('generic-command');

      expect(result.getTransportConfig()).toStrictEqual({
        command: 'generic',
        type: 'stdio',
        env: {
          VAR1: 'quoted value',
        },
        args: ['command'],
      });
      expect(result.configSchema.serialize()).toStrictEqual({
        type: 'object',
        properties: {
          VAR1: {
            type: 'string',
          },
        },
        required: ['VAR1'],
      });

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'generic',
          args: ['command'],
          cwd,
          env: expect.objectContaining({
            VAR1: 'quoted value',
          }),
        }),
      );
    });

    it('should handle commands without environment variables', () => {
      const result = parseCmd('generic command');

      expect(result.externalId).toBe('generic-command');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'generic',
        type: 'stdio',
        env: {},
        args: ['command'],
      });
      expect(result.configSchema.serialize()).toBeUndefined();

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'generic',
          args: ['command'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });
  });

  describe('generic commands', () => {
    it('should parse generic commands', () => {
      const result = parseCmd('generic command with args');

      expect(result.externalId).toBe('generic-command-with-args');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'generic',
        type: 'stdio',
        env: {},
        args: ['command', 'with', 'args'],
      });
      expect(result.configSchema.serialize()).toBeUndefined();

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'generic',
          args: ['command', 'with', 'args'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });

    it('should handle quoted arguments in generic commands', () => {
      const result = parseCmd('generic command "with quoted" args');

      expect(result.externalId).toBe('generic-command');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'generic',
        type: 'stdio',
        env: {},
        args: ['command', 'with quoted', 'args'],
      });
      expect(result.configSchema.serialize()).toBeUndefined();

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'generic',
          args: ['command', 'with quoted', 'args'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });
  });

  describe('docker commands', () => {
    it('should parse docker run commands', () => {
      const result = parseCmd('docker run --name container-name image:tag');

      expect(result.externalId).toBe('image:tag');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'docker',
        type: 'stdio',
        env: {},
        args: ['run', '--name=container-name', 'image:tag'],
      });
      expect(result.configSchema.serialize()).toBeUndefined();

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'docker',
          args: ['run', '--name=container-name', 'image:tag'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });

    it('should handle docker run with environment variables', () => {
      const result = parseCmd('docker run -e ENV_VAR=value image:tag');

      expect(result.externalId).toBe('image:tag');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'docker',
        type: 'stdio',
        env: {},
        args: ['run', '-e=ENV_VAR={{ENV_VAR}}', 'image:tag'],
      });
      expect(result.configSchema.serialize()).toStrictEqual({
        type: 'object',
        properties: {
          ENV_VAR: {
            type: 'string',
          },
        },
        required: ['ENV_VAR'],
      });

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'docker',
          args: ['run', '-e=ENV_VAR=value', 'image:tag'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });

    it('should throw an error if no run command is found', () => {
      expect(() => parseCmd('docker image:tag')).toThrow('No run command found');
    });

    it('should throw an error if no image name is found', () => {
      expect(() => parseCmd('docker run')).toThrow('No image name found');
    });
  });

  describe('npx commands', () => {
    it('should parse npx commands', () => {
      const result = parseCmd('npx package-name some-dir "some other value"');

      expect(result.externalId).toBe('package-name');

      expect(result.getTransportConfig()).toStrictEqual({
        command: 'npx',
        type: 'stdio',
        env: {},
        args: ['package-name', '{{ARG_0}}', '{{ARG_1}}'],
      });
      expect(result.configSchema.serialize()).toStrictEqual({
        properties: {
          ARG_0: {
            type: 'string',
          },
          ARG_1: {
            type: 'string',
          },
        },
        required: ['ARG_0', 'ARG_1'],
        type: 'object',
      });

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'npx',
          args: ['package-name', 'some-dir', 'some other value'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });

    it('should handle npx with boolean flags', () => {
      const result = parseCmd('npx -y package-name');

      expect(result.externalId).toBe('package-name');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'npx',
        type: 'stdio',
        env: {},
        args: ['-y', 'package-name'],
      });
      expect(result.configSchema.serialize()).toBeUndefined();

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'npx',
          args: ['-y', 'package-name'],
          cwd,
          env: expect.any(Object),
        }),
      );
    });

    it('should handle npx with environment variables', () => {
      const result = parseCmd(
        'SLACK_BOT_TOKEN=xoxb-your-bot-token SLACK_TEAM_ID=T01234567 SLACK_CHANNEL_IDS="C01234567, C76543210" npx -y @modelcontextprotocol/server-slack',
      );

      expect(result.externalId).toBe('@modelcontextprotocol/server-slack');
      expect(result.getTransportConfig()).toStrictEqual({
        command: 'npx',
        type: 'stdio',
        env: {
          SLACK_BOT_TOKEN: 'xoxb-your-bot-token',
          SLACK_TEAM_ID: 'T01234567',
          SLACK_CHANNEL_IDS: 'C01234567, C76543210',
        },
        args: ['-y', '@modelcontextprotocol/server-slack'],
      });
      expect(result.configSchema.serialize()).toStrictEqual({
        type: 'object',
        properties: {
          SLACK_BOT_TOKEN: {
            type: 'string',
          },
          SLACK_TEAM_ID: {
            type: 'string',
          },
          SLACK_CHANNEL_IDS: {
            type: 'string',
          },
        },
        required: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID', 'SLACK_CHANNEL_IDS'],
      });

      const cwd = '/test/cwd';
      expect(result.getStdioServerParameters(cwd)).toEqual(
        expect.objectContaining({
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-slack'],
          cwd,
          env: expect.objectContaining({
            SLACK_BOT_TOKEN: 'xoxb-your-bot-token',
            SLACK_TEAM_ID: 'T01234567',
            SLACK_CHANNEL_IDS: 'C01234567, C76543210',
          }),
        }),
      );
    });

    it('should throw an error if no package is found', () => {
      // When 'npx' is passed without a package, it throws 'No command name found'
      // because the parser expects a space after 'npx'
      expect(() => parseCmd('npx ')).toThrow('No package found');
    });
  });

  describe('error handling', () => {
    it('should throw an error if no command name is found', () => {
      expect(() => parseCmd('')).toThrow('No command name found');
    });
  });
});
