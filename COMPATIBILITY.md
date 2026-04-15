# Compatibility Matrix

## Tested ECC Versions

| ECC Version | Status | Notes |
|-------------|--------|-------|
| v1.10.0 | Tested | Baseline version |
| v1.9.x | Untested | Should work |
| v1.8.x | Untested | May work |
| < v1.8.0 | Unknown | API may differ |

## Requirements

| Dependency | Minimum Version |
|------------|-----------------|
| Node.js | 18.0.0 |
| PowerShell | 5.1 |
| Claude Code | 2.1+ (for hooks auto-load) |

## Known Issues

- None yet

## Reporting Issues

If you encounter compatibility issues, please open an issue with:
1. ECC version (`package.json` in ECC repo)
2. Node.js version (`node --version`)
3. Error message/stack trace
