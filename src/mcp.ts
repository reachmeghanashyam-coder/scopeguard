#!/usr/bin/env node
import * as readline from 'readline';
import { computeLineDiff } from './engine/differ.js';
import { resolveEnclosingSymbols } from './engine/astScanner.js';
import { classifyHunks } from './engine/classifier.js';
import { spliceSource } from './engine/splicer.js';

/**
 * ScopeGuard Model Context Protocol (MCP) Server
 * Enables external AI coding agents (GitLab Duo, Claude Code, Cursor)
 * to interact with ScopeGuard deterministically via stdio JSON-RPC.
 */

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: any;
}

const SERVER_NAME = 'scopeguard-mcp-server';
const SERVER_VERSION = '1.0.0';

const TOOLS = [
  {
    name: 'scopeguard_audit_diff',
    description: 'Inspect code changes against prompt intent to detect silent invariant breaches, deleted error handlers, and unrequested collateral drift.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The natural language prompt that guided the AI code modification.'
        },
        beforeCode: {
          type: 'string',
          description: 'The original code prior to the AI edits.'
        },
        afterCode: {
          type: 'string',
          description: 'The modified code produced by the AI agent.'
        }
      },
      required: ['prompt', 'beforeCode', 'afterCode']
    }
  },
  {
    name: 'scopeguard_auto_heal',
    description: 'Autonomously perform LCS surgical splicing to purge collateral damage and restore critical invariants while preserving authorized agent work.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The user prompt specifying the authorized task.'
        },
        beforeCode: {
          type: 'string',
          description: 'The original code.'
        },
        afterCode: {
          type: 'string',
          description: 'The AI modified code containing regressions.'
        }
      },
      required: ['prompt', 'beforeCode', 'afterCode']
    }
  }
];

function sendResponse(id: string | number | null | undefined, result: any) {
  const payload = {
    jsonrpc: '2.0',
    id: id ?? null,
    result
  };
  process.stdout.write(JSON.stringify(payload) + '\n');
}

function sendError(id: string | number | null | undefined, code: number, message: string) {
  const payload = {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message }
  };
  process.stdout.write(JSON.stringify(payload) + '\n');
}

export function handleMcpRequest(req: JsonRpcRequest) {
  const { id, method, params } = req;

  switch (method) {
    case 'initialize':
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION
        }
      });
      break;

    case 'tools/list':
      sendResponse(id, {
        tools: TOOLS
      });
      break;

    case 'tools/call': {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'scopeguard_audit_diff') {
        const { prompt, beforeCode, afterCode } = args;
        if (!prompt || beforeCode === undefined || afterCode === undefined) {
          return sendError(id, -32602, 'Missing required arguments: prompt, beforeCode, afterCode');
        }

        const rawHunks = computeLineDiff(beforeCode, afterCode);
        const resolved = resolveEnclosingSymbols(afterCode || beforeCode, rawHunks);
        const classified = classifyHunks(prompt, resolved);

        const authorized = classified.filter(h => h.status === 'AUTHORIZED');
        const breaches = classified.filter(h => h.status === 'INVARIANT_BREACH');
        const collateral = classified.filter(h => h.status === 'COLLATERAL_MUTATION' || h.status === 'SCOPE_CREEP');
        const total = classified.length;
        const purity = total > 0 ? Math.round((authorized.length / total) * 100) : 100;

        return sendResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                purityScore: purity,
                isSafe: breaches.length === 0 && collateral.length === 0,
                totalHunks: total,
                authorizedCount: authorized.length,
                breachCount: breaches.length,
                collateralCount: collateral.length,
                hunks: classified
              }, null, 2)
            }
          ]
        });
      }

      if (toolName === 'scopeguard_auto_heal') {
        const { prompt, beforeCode, afterCode } = args;
        if (!prompt || beforeCode === undefined || afterCode === undefined) {
          return sendError(id, -32602, 'Missing required arguments: prompt, beforeCode, afterCode');
        }

        const rawHunks = computeLineDiff(beforeCode, afterCode);
        const resolved = resolveEnclosingSymbols(afterCode || beforeCode, rawHunks);
        const classified = classifyHunks(prompt, resolved);

        const healHunks = classified.map(h => ({
          ...h,
          accepted: h.status === 'AUTHORIZED'
        }));

        const cleanSource = spliceSource(beforeCode, healHunks);
        const linesPurged = classified
          .filter(h => h.status !== 'AUTHORIZED')
          .reduce((acc, h) => acc + h.addedLines.length + h.deletedLines.length, 0);

        return sendResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'HEALED',
                linesPurged,
                cleanSource
              }, null, 2)
            }
          ]
        });
      }

      return sendError(id, -32601, `Unknown tool: ${toolName}`);
    }

    default:
      sendError(id, -32601, `Method not found: ${method}`);
  }
}

// Stdio JSON-RPC Listener
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const parsed: JsonRpcRequest = JSON.parse(trimmed);
    handleMcpRequest(parsed);
  } catch (err: any) {
    sendError(null, -32700, `Parse error: ${err.message}`);
  }
});
