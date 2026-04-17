# Compatibility

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Windows (PowerShell 5.1+) | Supported | Tested and verified |
| macOS / Linux | Portable | Script can be ported to Bash |

## Requirements

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| PowerShell | 5.1 | Windows only; no Node.js needed |
| ECC Source | Latest | Must have valid directory structure with `agents/`, `rules/`, `skills/`, etc. |

## ECC Directory Structure

The installer expects the ECC source to contain:

```
everything-claude-code/
├── agents/           # *.md files
├── rules/            # Subdirectories for rules
├── skills/           # Skill definitions
├── commands/         # *.md command files
├── hooks/
│   └── hooks.json
└── mcp-configs/
    └── mcp-servers.json
```

## Known Limitations

- PowerShell-only (Windows native)
- JSON merge operations use PowerShell's `ConvertFrom-Json` / `ConvertTo-Json`
- No validation of MCP server placeholders — must edit settings.json manually after install

## Known Issues

- None yet

## Troubleshooting

If the installer fails:

1. **ECC source not found**: Verify the `-SourcePath` points to a valid ECC repository
2. **Target directory not found**: Ensure `-TargetPath` exists before running the installer
3. **Missing ECC subdirectories**: Confirm your ECC source includes `agents/`, `rules/`, `skills/` directories
4. **Permission denied**: Run PowerShell as Administrator if you lack write permissions to target
5. **JSON merge errors**: Check `settings.json` formatting; ensure it's valid JSON before and after merge operations
