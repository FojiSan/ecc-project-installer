#!/usr/bin/env pwsh
<#
.SYNOPSIS
    ECC Project Installer - Install Everything Claude Code to project-local directory.

.DESCRIPTION
    Installs ECC components to ./.claude/ in the current project directory.
    Non-invasive: does not modify the original ECC installation.

.PARAMETER Languages
    Comma-separated list of languages (default: typescript)

.PARAMETER DryRun
    Show what would be installed without making changes

.PARAMETER EccPath
    Override ECC source path (default: ~/.claude/plugins/marketplaces/everything-claude-code)

.EXAMPLE
    .\install-local.ps1
    .\install-local.ps1 -Languages "typescript,python"
    .\install-local.ps1 -DryRun
#>

param(
    [string]$Languages = "typescript",
    [switch]$DryRun,
    [string]$EccPath
)

$ErrorActionPreference = "Stop"

# M3 fix: Resolve script directory (handles both file and directory symlinks)
$ScriptPath = $MyInvocation.MyCommand.Definition

# First, resolve file-level symlink if the script itself is symlinked
$ScriptItem = Get-Item $ScriptPath -Force
if ($ScriptItem.Target) {
    $ScriptPath = $ScriptItem.Target
}

$ScriptDir = Split-Path -Parent $ScriptPath

# Then resolve directory-level symlink if needed
if (Test-Path $ScriptDir -PathType Container) {
    $DirItem = Get-Item $ScriptDir -Force
    if ($DirItem.Target) { $ScriptDir = $DirItem.Target }
}

# Find Node.js
$NodePath = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $NodePath) {
    # Try Volta
    $VoltaNode = Join-Path $env:LOCALAPPDATA "Volta\bin\node.exe"
    if (Test-Path $VoltaNode) {
        $NodePath = $VoltaNode
    } else {
        Write-Error "Node.js not found. Install Node.js or Volta first."
        exit 1
    }
}

Write-Host "Using Node.js: $NodePath" -ForegroundColor Cyan

# Build arguments
$InstallerScript = Join-Path $ScriptDir "src\install-apply-local.js"

$NodeArgs = @($InstallerScript)

if ($Languages) {
    $NodeArgs += "--languages"
    $NodeArgs += $Languages
}

if ($DryRun) {
    $NodeArgs += "--dry-run"
}

if ($EccPath) {
    $NodeArgs += "--ecc-path"
    $NodeArgs += $EccPath
}

# Execute
Write-Host "Running ECC Project Installer..." -ForegroundColor Green
& $NodePath $NodeArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Installation failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "ECC installed to: $(Get-Location)\.claude\" -ForegroundColor Cyan
