import { describe, it, expect, vi } from 'vitest';
import { handleMcpRequest } from '../src/mcp.js';

describe('ScopeGuard MCP Server (Model Context Protocol)', () => {
  it('responds with protocol capabilities and tool schema on initialize', () => {
    let captured = '';
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      captured += str;
      return true;
    });

    handleMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize'
    });

    writeSpy.mockRestore();

    const response = JSON.parse(captured.trim());
    expect(response.result.protocolVersion).toBe('2024-11-05');
    expect(response.result.serverInfo.name).toBe('scopeguard-mcp-server');
  });

  it('lists scopeguard_audit_diff and scopeguard_auto_heal tools', () => {
    let captured = '';
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      captured += str;
      return true;
    });

    handleMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });

    writeSpy.mockRestore();

    const response = JSON.parse(captured.trim());
    const tools = response.result.tools;
    expect(tools.map((t: any) => t.name)).toContain('scopeguard_audit_diff');
    expect(tools.map((t: any) => t.name)).toContain('scopeguard_auto_heal');
  });

  it('executes scopeguard_audit_diff tool and returns AST invariant breach detection', () => {
    let captured = '';
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      captured += str;
      return true;
    });

    const beforeCode = `function test() {\n  try {\n    return 42;\n  } catch (e) {}\n}`;
    const afterCode = `function test() {\n  return 42;\n}`;

    handleMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'scopeguard_audit_diff',
        arguments: {
          prompt: 'Add comment',
          beforeCode,
          afterCode
        }
      }
    });

    writeSpy.mockRestore();

    const response = JSON.parse(captured.trim());
    const resultData = JSON.parse(response.result.content[0].text);
    expect(resultData.isSafe).toBe(false);
    expect(resultData.breachCount).toBeGreaterThan(0);
  });

  it('executes scopeguard_auto_heal tool to surgically restore stripped invariants', () => {
    let captured = '';
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      captured += str;
      return true;
    });

    const beforeCode = `function test() {\n  try {\n    return 42;\n  } catch (e) {}\n}`;
    const afterCode = `function test() {\n  return 42;\n}`;

    handleMcpRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'scopeguard_auto_heal',
        arguments: {
          prompt: 'Add comment',
          beforeCode,
          afterCode
        }
      }
    });

    writeSpy.mockRestore();

    const response = JSON.parse(captured.trim());
    const resultData = JSON.parse(response.result.content[0].text);
    expect(resultData.status).toBe('HEALED');
    expect(resultData.cleanSource).toContain('try {');
  });
});
