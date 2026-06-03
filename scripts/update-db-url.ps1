Param(
  [Parameter(Mandatory=$true)]
  [string]$NewDatabaseUrl
)

$envFile = Join-Path $PSScriptRoot ".." ".env"
if (-Not (Test-Path $envFile)) {
  Write-Error ".env file not found at $envFile"
  exit 1
}

Write-Host "Updating DATABASE_URL in $envFile"
(Get-Content $envFile) -replace 'DATABASE_URL=".*"', "DATABASE_URL=\"$NewDatabaseUrl\"" | Set-Content $envFile
Write-Host "Done. Please restart your app/processes that read .env"
