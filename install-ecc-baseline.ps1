# install-ecc-baseline.ps1
# Full-mode installer: copies ALL ECC components into target project's .claude/ directory.
# Installs agents, rules (all subdirs), skills, commands, hooks, and MCP configs.
#
# Usage:
#   .\install-ecc-baseline.ps1 -SourcePath "C:\path\to\everything-claude-code" -TargetPath "C:\path\to\my-project"
#   .\install-ecc-baseline.ps1 -TargetPath "C:\path\to\my-project"   # prompts for SourcePath
#
# IMPORTANT: After install, edit .claude/settings.json and replace YOUR_*_HERE placeholders with real API keys.

param(
    [string]$SourcePath = $env:ECC_SOURCE,
    [string]$TargetPath = (Get-Location).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Resolve SourcePath ---

if (-not $SourcePath) {
    $SourcePath = Read-Host "Path to ECC source repo (everything-claude-code)"
}

$SourcePath = $SourcePath.TrimEnd('\', '/')
$TargetPath = $TargetPath.TrimEnd('\', '/')

# --- Validate inputs ---

if (-not (Test-Path $SourcePath -PathType Container)) {
    Write-Error "ECC source not found: $SourcePath"
    exit 1
}

if (-not (Test-Path "$SourcePath\agents" -PathType Container)) {
    Write-Error "Not a valid ECC repo (missing agents/ dir): $SourcePath"
    exit 1
}

if (-not (Test-Path $TargetPath -PathType Container)) {
    Write-Error "Target project directory not found: $TargetPath"
    exit 1
}

$ClaudeDest   = Join-Path $TargetPath ".claude"
$SettingsFile = Join-Path $ClaudeDest "settings.json"

Write-Host "ECC source  : $SourcePath"
Write-Host "Target      : $TargetPath"
Write-Host "Destination : $ClaudeDest"
Write-Host ""

# --- Helper: copy a directory recursively ---

function Copy-Dir {
    param([string]$Src, [string]$Dst, [string]$Label)

    if (-not (Test-Path $Src -PathType Container)) {
        Write-Warning "  [SKIP] $Label — source not found: $Src"
        return
    }

    Write-Host "  Copying $Label ..."
    if (-not (Test-Path $Dst)) {
        New-Item -ItemType Directory -Path $Dst -Force | Out-Null
    }
    Copy-Item -Path "$Src\*" -Destination $Dst -Recurse -Force
    Write-Host "    -> $Dst"
}

# --- Helper: copy individual files matching a glob pattern ---

function Copy-Files {
    param([string]$Pattern, [string]$Dst, [string]$Label)

    $files = Get-Item -Path $Pattern -ErrorAction SilentlyContinue
    if (-not $files) {
        Write-Warning "  [SKIP] $Label — no files matched: $Pattern"
        return
    }

    Write-Host "  Copying $Label ..."
    if (-not (Test-Path $Dst)) {
        New-Item -ItemType Directory -Path $Dst -Force | Out-Null
    }
    foreach ($f in $files) {
        Copy-Item -Path $f.FullName -Destination $Dst -Force
    }
    Write-Host "    -> $Dst"
}

# --- Helper: merge a JSON object's key into settings.json ---
# Reads $SourceJson, extracts $Key (e.g. "hooks"), deep-merges into settings.json.

function Merge-JsonKey {
    param([string]$SourceJson, [string]$Key, [string]$Label)

    if (-not (Test-Path $SourceJson -PathType Leaf)) {
        Write-Warning "  [SKIP] $Label — source not found: $SourceJson"
        return
    }

    Write-Host "  Merging $Label into settings.json ..."

    $srcContent = Get-Content $SourceJson -Raw | ConvertFrom-Json
    $dst = if (Test-Path $SettingsFile -PathType Leaf) {
        Get-Content $SettingsFile -Raw | ConvertFrom-Json
    } else {
        [pscustomobject]@{}
    }

    $srcValue = $srcContent.$Key
    if ($null -eq $srcValue) {
        Write-Warning "  [SKIP] $Label — key '$Key' not found in source"
        return
    }

    $dstValue = $dst.$Key
    if ($null -ne $dstValue) {
        # Hooks: merge each event array, deduplicating by id
        if ($Key -eq "hooks") {
            $srcValue.PSObject.Properties | ForEach-Object {
                $event    = $_.Name
                $srcHooks = $_.Value
                if ($null -ne $dstValue.$event) {
                    $existingIds = $dstValue.$event | Where-Object { $_.id } | ForEach-Object { $_.id }
                    foreach ($hook in $srcHooks) {
                        if ($hook.id -and $existingIds -contains $hook.id) {
                            Write-Host "    [skip duplicate] $($hook.id)"
                        } else {
                            $dstValue.$event += $hook
                        }
                    }
                } else {
                    $dstValue | Add-Member -NotePropertyName $event -NotePropertyValue $srcHooks -Force
                }
            }
            $dst | Add-Member -NotePropertyName $Key -NotePropertyValue $dstValue -Force
        }
        # mcpServers: merge server keys, skip existing entries
        elseif ($Key -eq "mcpServers") {
            $srcValue.PSObject.Properties | ForEach-Object {
                $serverName = $_.Name
                if ($null -ne $dstValue.$serverName) {
                    Write-Host "    [skip existing] mcpServer: $serverName"
                } else {
                    $dstValue | Add-Member -NotePropertyName $serverName -NotePropertyValue $_.Value -Force
                }
            }
            $dst | Add-Member -NotePropertyName $Key -NotePropertyValue $dstValue -Force
        }
        # Default: overwrite
        else {
            $dst | Add-Member -NotePropertyName $Key -NotePropertyValue $srcValue -Force
        }
    } else {
        $dst | Add-Member -NotePropertyName $Key -NotePropertyValue $srcValue -Force
    }

    $dstDir = Split-Path $SettingsFile -Parent
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    $dst | ConvertTo-Json -Depth 20 | Set-Content $SettingsFile -Encoding UTF8
    Write-Host "    -> $SettingsFile"
}

# --- Create .claude/ if it does not exist ---

if (-not (Test-Path $ClaudeDest)) {
    Write-Host "Creating $ClaudeDest"
    New-Item -ItemType Directory -Path $ClaudeDest -Force | Out-Null
}

Write-Host "Installing ECC components..."

# --- Step 1: Copy agents ---
# README: cp everything-claude-code/agents/*.md ~/.claude/agents/

Copy-Files "$SourcePath\agents\*.md" "$ClaudeDest\agents" "agents/*.md"

# --- Step 2: Copy ALL rules subdirectories ---
# Copies every subdirectory under rules/ (common, typescript, python, golang, etc.)

Copy-Dir "$SourcePath\rules" "$ClaudeDest\rules" "rules/*"

# --- Step 3: Copy ALL skills ---
# Primary path:  .agents/skills/*
# Secondary path: skills/*

Copy-Dir "$SourcePath\.agents\skills" "$ClaudeDest\skills" ".agents/skills/*"
Copy-Dir "$SourcePath\skills"         "$ClaudeDest\skills" "skills/*"

# --- Step 4: Copy commands ---
# README: "Optional: keep legacy slash-command compatibility during migration"

Copy-Files "$SourcePath\commands\*.md" "$ClaudeDest\commands" "commands/*.md"

# --- Step 5: Merge hooks into settings.json ---
# README: "Copy the hooks from hooks/hooks.json to your ~/.claude/settings.json"
# Merges the "hooks" key with deduplication; does not overwrite the whole file.

Merge-JsonKey "$SourcePath\hooks\hooks.json" "hooks" "hooks/hooks.json -> hooks"

# --- Step 6: Merge MCP configs into settings.json ---
# README: "Copy desired MCP server definitions from mcp-configs/mcp-servers.json"
# Skips servers that already exist in destination.
# IMPORTANT: Replace YOUR_*_HERE placeholders with actual API keys after install.

Merge-JsonKey "$SourcePath\mcp-configs\mcp-servers.json" "mcpServers" "mcp-configs/mcp-servers.json -> mcpServers"

Write-Host ""
Write-Host "Done. ECC installed to $ClaudeDest"
Write-Host "IMPORTANT: Edit $SettingsFile and replace YOUR_*_HERE placeholders with real API keys."
