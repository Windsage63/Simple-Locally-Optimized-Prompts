<#
Purpose:
    Replace a repo's `.agents` folder or submodule with a local junction to a shared
    WindSkills clone on the current machine.

How it works:
    - Run this once per repo on each machine.
    - Each repo gets a `.agents` junction that points to one shared WindSkills clone.
    - You can edit skills through any repo's `.agents` path because it is the same file
      on disk as the shared WindSkills clone.
    - Commit and push skill changes from the shared WindSkills repo, not from the parent
      project repo.

Parameters:
    - `-WindSkillsPath` is the local path to your shared WindSkills clone.
    - `-RepoPaths` takes one or more repo paths.

Examples:
    powershell -NoProfile -ExecutionPolicy Bypass -File .\devtools\set-windskills-junction.ps1 `
        -WindSkillsPath D:\SDai\WindSkills `
        -RepoPaths D:\SDai\Simple-Locally-Optimized-Prompts

    powershell -NoProfile -ExecutionPolicy Bypass -File .\devtools\set-windskills-junction.ps1 `
        -WindSkillsPath D:\SDai\WindSkills `
        -RepoPaths D:\SDai\AISightStudio,D:\SDai\SimplyNarrated

    powershell -NoProfile -ExecutionPolicy Bypass -File .\devtools\set-windskills-junction.ps1 `
        -WindSkillsPath D:\SDai\WindSkills `
        -RepoPaths 'D:\SDai\AISightStudio', 'D:\SDai\SimplyNarrated'

After editing a skill:
    1. Edit the skill anywhere under `.agents` in any project.
    2. Open the shared WindSkills repo.
    3. Run `git status`, `git add`, `git commit`, and `git push` there.
    4. On another machine, pull the WindSkills repo in that machine's shared clone.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$WindSkillsPath,

    [Parameter(Mandatory = $true)]
    [string[]]$RepoPaths
)

$ErrorActionPreference = 'Stop'

function Invoke-GitQuietly {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $stdoutPath = [System.IO.Path]::GetTempFileName()
    $stderrPath = [System.IO.Path]::GetTempFileName()

    $quotedArguments = $Arguments | ForEach-Object {
        if ($_ -match '[\s"]') {
            '"' + ($_ -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
        }
        else {
            $_
        }
    }

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = 'git.exe'
    $startInfo.Arguments = ($quotedArguments -join ' ')
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    try {
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $startInfo
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        Set-Content -LiteralPath $stdoutPath -Value $stdout -NoNewline
        Set-Content -LiteralPath $stderrPath -Value $stderr -NoNewline
        return $process.ExitCode
    }
    finally {
        Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
    }
}

function Resolve-ExistingPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Path does not exist: $Path"
    }

    return (Resolve-Path -LiteralPath $Path).Path
}

function Test-GitRepository {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return (Invoke-GitQuietly -Arguments @('-C', $Path, 'rev-parse', '--is-inside-work-tree')) -eq 0
}

function Ensure-IgnoreEntry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath,

        [Parameter(Mandatory = $true)]
        [string]$Entry
    )

    $gitIgnorePath = Join-Path $RepoPath '.gitignore'
    if (-not (Test-Path -LiteralPath $gitIgnorePath)) {
        New-Item -ItemType File -Path $gitIgnorePath | Out-Null
    }

    $currentLines = Get-Content -LiteralPath $gitIgnorePath -ErrorAction SilentlyContinue
    if ($currentLines -notcontains $Entry) {
        Add-Content -LiteralPath $gitIgnorePath -Value $Entry
    }
}

function Remove-AgentsSubmoduleState {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath
    )

    & git -C $RepoPath rm --cached --ignore-unmatch -- '.agents' | Out-Null

    $modulesPath = Join-Path $RepoPath '.git\modules\.agents'
    if (Test-Path -LiteralPath $modulesPath) {
        Remove-Item -LiteralPath $modulesPath -Recurse -Force
    }

    $gitModulesPath = Join-Path $RepoPath '.gitmodules'
    if (Test-Path -LiteralPath $gitModulesPath) {
        Invoke-GitQuietly -Arguments @('-C', $RepoPath, 'config', '-f', '.gitmodules', '--remove-section', 'submodule..agents') | Out-Null

        $content = Get-Content -LiteralPath $gitModulesPath -Raw
        if ([string]::IsNullOrWhiteSpace($content)) {
            Remove-Item -LiteralPath $gitModulesPath -Force
        }
    }

    Invoke-GitQuietly -Arguments @('-C', $RepoPath, 'config', '--local', '--remove-section', 'submodule..agents') | Out-Null
}

function Remove-AgentsPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath
    )

    $agentsPath = Join-Path $RepoPath '.agents'
    if (-not (Test-Path -LiteralPath $agentsPath)) {
        return
    }

    $item = Get-Item -LiteralPath $agentsPath -Force
    $isReparsePoint = ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0

    if ($isReparsePoint) {
        & cmd.exe /c rmdir "$agentsPath" 1>$null 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to remove junction: $agentsPath"
        }
        return
    }

    Remove-Item -LiteralPath $agentsPath -Recurse -Force
}

function Set-WindSkillsJunction {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath,

        [Parameter(Mandatory = $true)]
        [string]$SharedWindSkillsPath
    )

    $resolvedRepoPath = Resolve-ExistingPath -Path $RepoPath
    if (-not (Test-GitRepository -Path $resolvedRepoPath)) {
        throw "Not a git repository: $resolvedRepoPath"
    }

    Remove-AgentsSubmoduleState -RepoPath $resolvedRepoPath
    Remove-AgentsPath -RepoPath $resolvedRepoPath
    Ensure-IgnoreEntry -RepoPath $resolvedRepoPath -Entry '.agents/'

    $agentsPath = Join-Path $resolvedRepoPath '.agents'
    New-Item -ItemType Junction -Path $agentsPath -Target $SharedWindSkillsPath | Out-Null

    Write-Host ""
    Write-Host "Repo: $resolvedRepoPath"
    Write-Host "Linked .agents -> $SharedWindSkillsPath"
    & git -C $resolvedRepoPath status --short --ignored -- .gitignore .gitmodules .agents
}

$resolvedWindSkillsPath = Resolve-ExistingPath -Path $WindSkillsPath
if (-not (Test-GitRepository -Path $resolvedWindSkillsPath)) {
    throw "WindSkills path is not a git repository: $resolvedWindSkillsPath"
}

foreach ($repoPath in $RepoPaths) {
    Set-WindSkillsJunction -RepoPath $repoPath -SharedWindSkillsPath $resolvedWindSkillsPath
}