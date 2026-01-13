#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { shutdown } from './browser.js';
import * as navigation from './tools/navigation.js';
import * as consoleTool from './tools/console.js';
import * as network from './tools/network.js';
import * as inspection from './tools/inspection.js';
import * as react from './tools/react.js';
import * as debug from './tools/debug.js';

// Create the MCP server
const server = new Server(
  {
    name: 'playwright-debug-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS = [
  // Navigation tools
  {
    name: 'navigate',
    description: 'Navigate to a URL in the browser. Launches browser if not already running.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The URL to navigate to' },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          description: 'When to consider navigation complete (default: load)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'click',
    description: 'Click on an element matching the given selector',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for the element to click' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (default: left)' },
        clickCount: { type: 'number', description: 'Number of clicks (default: 1)' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'fill',
    description: 'Fill a form field with the given value. Clears existing content first.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input field' },
        value: { type: 'string', description: 'Value to fill in' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'select',
    description: 'Select option(s) from a dropdown/select element',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for the select element' },
        value: {
          oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          description: 'Value(s) to select',
        },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'scroll',
    description: 'Scroll the page or scroll an element into view',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for element to scroll into view' },
        x: { type: 'number', description: 'Horizontal scroll offset in pixels' },
        y: { type: 'number', description: 'Vertical scroll offset in pixels' },
      },
    },
  },
  {
    name: 'wait_for',
    description: 'Wait for an element to appear/disappear or for navigation to a URL',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for' },
        state: { type: 'string', enum: ['attached', 'detached', 'visible', 'hidden'], description: 'State to wait for (default: visible)' },
        url: { type: 'string', description: 'URL pattern to wait for (alternative to selector)' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
    },
  },
  {
    name: 'hover',
    description: 'Hover over an element',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for element to hover' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'type',
    description: 'Type text into an element character by character (useful for autocomplete)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input element' },
        text: { type: 'string', description: 'Text to type' },
        delay: { type: 'number', description: 'Delay between keystrokes in ms (default: 0)' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'go_back',
    description: 'Go back to the previous page in browser history',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'go_forward',
    description: 'Go forward to the next page in browser history',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'reload',
    description: 'Reload the current page',
    inputSchema: { type: 'object' as const, properties: {} },
  },

  // Console tools
  {
    name: 'get_console',
    description: 'Get console log entries from the page. Useful for seeing errors, warnings, and debug output.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        level: { type: 'string', enum: ['log', 'info', 'warn', 'error', 'debug'], description: 'Filter by log level' },
        last: { type: 'number', description: 'Return only the last N entries' },
        search: { type: 'string', description: 'Filter logs containing this text' },
      },
    },
  },
  {
    name: 'clear_console',
    description: 'Clear captured console logs',
    inputSchema: { type: 'object' as const, properties: {} },
  },

  // Network tools
  {
    name: 'get_network',
    description: 'Get network request log. See API calls, their status codes, and timing. Essential for debugging Lambda/API issues.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        filter: { type: 'string', description: 'Filter requests by URL (substring match)' },
        method: { type: 'string', description: 'Filter by HTTP method (GET, POST, etc.)' },
        status: { type: 'string', enum: ['success', 'error', 'all'], description: 'Filter by status: success (2xx-3xx), error (4xx-5xx or failed)' },
        last: { type: 'number', description: 'Return only the last N requests' },
      },
    },
  },
  {
    name: 'get_request_detail',
    description: 'Get detailed info about a specific network request including headers',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Request ID from get_network output' },
        url: { type: 'string', description: 'URL substring to find (uses most recent match)' },
      },
    },
  },
  {
    name: 'clear_network',
    description: 'Clear captured network logs',
    inputSchema: { type: 'object' as const, properties: {} },
  },

  // DOM inspection tools
  {
    name: 'get_dom',
    description: 'Get a summarized DOM tree. Returns tag names, IDs, classes, and text content in a digestible format.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for root element (default: body)' },
        depth: { type: 'number', description: 'Maximum depth to traverse (default: 6)' },
      },
    },
  },
  {
    name: 'get_element',
    description: 'Get detailed information about a specific element including computed styles and bounding box',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for the element' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'get_text_content',
    description: 'Get visible text content of elements matching a selector',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for elements' },
      },
      required: ['selector'],
    },
  },

  // Screenshot and evaluation
  {
    name: 'screenshot',
    description: 'Take a screenshot of the page or a specific element. Returns base64 PNG image.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector to screenshot specific element' },
        fullPage: { type: 'boolean', description: 'Capture full scrollable page (default: false)' },
      },
    },
  },
  {
    name: 'evaluate_js',
    description: 'Execute arbitrary JavaScript in the page context. Powerful for custom inspection and debugging.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute. Use "return" to return values.' },
      },
      required: ['code'],
    },
  },

  // React tools
  {
    name: 'get_react_tree',
    description: 'Get the React component tree with props and state. Works with React 16+.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        depth: { type: 'number', description: 'Maximum depth to traverse (default: 8)' },
      },
    },
  },
  {
    name: 'find_component',
    description: 'Find React components by name. Returns matching components with their props and state.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Component name to search for (case-insensitive substring match)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_component_state',
    description: 'Get detailed state and props for a specific React component',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Component name to find' },
        index: { type: 'number', description: 'If multiple matches, which one (0-indexed, default: 0)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'collect_component_instances',
    description: 'Collect all instances of a React component type with props→HTML mapping. Useful for understanding component behavior, comparing different usages, or extracting component patterns. Returns props, rendered HTML, and minified source for each instance.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Component name to search for (case-insensitive). If omitted, collects all components.' },
        maxInstances: { type: 'number', description: 'Maximum instances to collect per component type (default: 20)' },
      },
    },
  },

  // Debug tools
  {
    name: 'explain_error',
    description: 'Analyze a console error with full context: related network requests, React state, and debugging suggestions. Best tool for diagnosing issues.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        index: { type: 'number', description: 'Error index (default: most recent error)' },
        search: { type: 'string', description: 'Find error containing this text' },
      },
    },
  },
  {
    name: 'get_debug_summary',
    description: 'Get a quick overview of the debugging state: page info, error count, failed requests',
    inputSchema: { type: 'object' as const, properties: {} },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Helper to cast args safely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const a = (args: Record<string, unknown>): any => args;

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;

    switch (name) {
      // Navigation
      case 'navigate':
        result = await navigation.navigate(a(args));
        break;
      case 'click':
        result = await navigation.click(a(args));
        break;
      case 'fill':
        result = await navigation.fill(a(args));
        break;
      case 'select':
        result = await navigation.select(a(args));
        break;
      case 'scroll':
        result = await navigation.scroll(a(args));
        break;
      case 'wait_for':
        result = await navigation.waitFor(a(args));
        break;
      case 'hover':
        result = await navigation.hover(a(args));
        break;
      case 'type':
        result = await navigation.type(a(args));
        break;
      case 'go_back':
        result = await navigation.goBack();
        break;
      case 'go_forward':
        result = await navigation.goForward();
        break;
      case 'reload':
        result = await navigation.reload();
        break;

      // Console
      case 'get_console':
        result = await consoleTool.getConsole(a(args));
        break;
      case 'clear_console':
        result = await consoleTool.clearConsole();
        break;

      // Network
      case 'get_network':
        result = await network.getNetwork(a(args));
        break;
      case 'get_request_detail':
        result = await network.getRequestDetail(a(args));
        break;
      case 'clear_network':
        result = await network.clearNetwork();
        break;

      // DOM Inspection
      case 'get_dom':
        result = await inspection.getDom(a(args));
        break;
      case 'get_element':
        result = await inspection.getElement(a(args));
        break;
      case 'get_text_content':
        result = await inspection.getTextContent(a(args));
        break;

      // Screenshot & Evaluation
      case 'screenshot':
        result = await inspection.screenshot(a(args));
        break;
      case 'evaluate_js':
        result = await inspection.evaluateJs(a(args));
        break;

      // React
      case 'get_react_tree':
        result = await react.getReactTree(a(args));
        break;
      case 'find_component':
        result = await react.findComponent(a(args));
        break;
      case 'get_component_state':
        result = await react.getComponentState(a(args));
        break;
      case 'collect_component_instances':
        result = await react.collectComponentInstances(a(args));
        break;

      // Debug
      case 'explain_error':
        result = await debug.explainError(a(args));
        break;
      case 'get_debug_summary':
        result = await debug.getDebugSummary();
        break;

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    // Special handling for screenshot - return image content
    if (name === 'screenshot' && result.success && result.data) {
      const data = result.data as { base64: string; mimeType: string };
      return {
        content: [
          {
            type: 'image',
            data: data.base64,
            mimeType: data.mimeType,
          },
        ],
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      isError: !result.success,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Playwright Debug MCP server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
