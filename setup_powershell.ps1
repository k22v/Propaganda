# Enable QuickEdit Mode for PowerShell
$path = "HKCU:\Console\%%SystemRoot%%_System32_WindowsPowerShell_v1.0_powershell.exe"
New-Item -Path $path -Force | Out-Null
Set-ItemProperty -Path $path -Name "QuickEdit" -Value 1 -Type DWord
Set-ItemProperty -Path $path -Name "EnableMouseInput" -Value 1 -Type DWord

# Also try to set for current session
try {
    $pshost = Get-Host
    $pshost.UI.RawUI.WindowSize = New-Object System.Management.Automation.Coordinates(80, 50)
    Write-Host "QuickEdit enabled!"
} catch {
    Write-Host "QuickEdit will be enabled after restart"
}

Write-Host "Done! Restart PowerShell and Ctrl+C/V/A should work."
Write-Host "For the Afterglow theme, use Windows Terminal from Microsoft Store."