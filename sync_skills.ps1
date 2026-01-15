# Multi-Agent Skill Sync Script (Windows/PowerShell)
# This script ensures that skills created in .agents/skills are visible to 
# GitHub (.github/skills) without duplicating files.

$SourceDir = Join-Path $PSScriptRoot ".agents\skills"
$Targets = @(
    Join-Path $PSScriptRoot ".github\skills"
)

# Get all skill folders from the primary source
$Skills = Get-ChildItem -Path $SourceDir -Directory

foreach ($Skill in $Skills) {
    $SkillName = $Skill.Name
    $SkillPath = $Skill.FullName
    
    foreach ($TargetBase in $Targets) {
        if (-not (Test-Path $TargetBase)) {
            New-Item -ItemType Directory -Path $TargetBase -Force | Out-Null
        }
        
        $TargetPath = Join-Path $TargetBase $SkillName
        
        if (-not (Test-Path $TargetPath)) {
            Write-Host "Linking $SkillName to $TargetBase..." -ForegroundColor Cyan
            # Using Junctions (/J) for directory links on Windows
            # This works across different platforms and doesn't require Admin privileges for directories
            New-Item -ItemType Junction -Path $TargetPath -Value $SkillPath | Out-Null
        } else {
            Write-Host "Skill $SkillName already exists/linked in $TargetBase." -ForegroundColor Gray
        }
    }
}

Write-Host "`nSkill Sync Complete! All agents now share the same source files." -ForegroundColor Green
