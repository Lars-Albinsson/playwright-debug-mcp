# Contributing to Playwright React Debug MCP

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/Lars-Albinsson/playwright-react-debug-mcp
   cd playwright-react-debug-mcp
   ```
3. **Install dependencies**:
   ```bash
   npm install
   npx playwright install chromium
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```

## Development Workflow

### Running in Development

```bash
# Watch mode - rebuilds on file changes
npm run dev

# In another terminal, test with Claude Desktop or Claude Code
```

### Project Structure

```
playwright-react-debug-mcp/
├── src/
│   ├── index.ts           # MCP server entry point, tool definitions
│   ├── browser.ts         # Browser lifecycle management
│   ├── state.ts           # State management (logs, requests)
│   ├── types.ts           # TypeScript interfaces
│   └── tools/
│       ├── navigation.ts  # Navigation and interaction tools
│       ├── console.ts     # Console log tools
│       ├── network.ts     # Network monitoring tools
│       ├── inspection.ts  # DOM inspection tools
│       ├── react.ts       # React debugging tools
│       ├── debug.ts       # Error analysis tools
│       └── index.ts       # Tool exports
├── docs/                  # GitHub Pages documentation
├── dist/                  # Compiled output
└── package.json
```

### Code Style

- **TypeScript** - All code is written in TypeScript with strict mode
- **ES Modules** - Use ES module syntax (`import`/`export`)
- **Formatting** - Use consistent indentation (2 spaces)
- **Types** - Export interfaces from `types.ts`, use explicit types

## Making Changes

### Adding a New Tool

1. **Define the tool** in `src/index.ts`:
   ```typescript
   {
     name: 'my_new_tool',
     description: 'Description of what this tool does',
     inputSchema: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: '...' }
       },
       required: ['param1']
     }
   }
   ```

2. **Implement the handler** in the appropriate file under `src/tools/`:
   ```typescript
   export async function myNewTool(page: Page, args: MyToolArgs): Promise<ToolResult> {
     // Implementation
     return { success: true, data: result };
   }
   ```

3. **Add the case** in the tool handler switch in `src/index.ts`

4. **Document the tool** in `docs/tools/`

### Modifying Existing Tools

- Maintain backward compatibility when possible
- Update documentation for any parameter changes
- Test with various inputs

## Testing

### Manual Testing

1. Build the project: `npm run build`
2. Configure Claude Desktop or Claude Code to use your local build
3. Test the tools interactively

### Test Scenarios

When testing, verify:
- Happy path works correctly
- Error handling for invalid inputs
- Edge cases (empty selectors, missing elements, etc.)
- Performance with large pages

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** with clear, focused commits

3. **Update documentation** if needed:
   - Update README.md for user-facing changes
   - Update docs/ for new or modified tools

4. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

5. **Open a Pull Request** with:
   - Clear title describing the change
   - Description of what and why
   - Any testing you've done

### Commit Messages

Use clear, descriptive commit messages:

```
Add collect_component_instances tool

- Extracts all instances of a React component type
- Includes props and rendered HTML for each instance
- Useful for understanding component usage patterns
```

### PR Review

- PRs require review before merging
- Address feedback constructively
- Keep PRs focused - one feature or fix per PR

## Reporting Issues

### Bug Reports

Include:
- Node.js version
- OS and version
- Steps to reproduce
- Expected vs actual behavior
- Console output or error messages

### Feature Requests

Include:
- Use case description
- Proposed solution (if any)
- Alternatives considered

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the code, not the person
- Assume good intentions

## Questions?

- Open an issue for questions
- Tag with `question` label

---

Thank you for contributing!
