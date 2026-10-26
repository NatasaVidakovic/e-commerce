param(
    [string]$SqlServer = '.\SQLEXPRESS',
    [string]$Database = 'NoliLocal'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$runtimeDir = Join-Path $repoRoot '.local\noli'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

# The local preview has its own database and Redis instance.
$redisRunning = docker ps -a --filter 'name=^noli-local-redis$' --format '{{.Names}}'
if (-not $redisRunning) {
    docker run -d --name noli-local-redis -p 127.0.0.1:6381:6379 -v noli-local-redis-data:/data redis:7-alpine redis-server --appendonly yes
    if ($LASTEXITCODE -ne 0) { throw 'Could not start the local Redis container.' }
} else {
    docker start noli-local-redis | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not start the local Redis container.' }
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ConnectionStrings__DefaultConnection = "Server=$SqlServer;Database=$Database;Trusted_Connection=True;TrustServerCertificate=True"
$env:ConnectionStrings__Redis = 'localhost:6381,abortConnect=false'
$env:NoliDemo__SeedCatalog = 'true'
$env:UseMockPaymentService = 'true'
$env:ImageStorage__Provider = 'local'
$env:REDIS_CACHING = 'false'
$env:Cors__AllowedOrigins__0 = 'http://localhost:4200'
$env:Cors__AllowedOrigins__1 = 'https://localhost:4200'
$env:FRONTEND_URL = 'http://localhost:4200'

if (-not $env:ADMIN_USER_PASSWORD) {
    $secretFile = Join-Path $env:APPDATA 'Microsoft\UserSecrets\b4ebcdda-0cf7-4c98-bb96-470539ca9716\secrets.json'
    if (Test-Path -LiteralPath $secretFile) {
        $localConfig = Get-Content -LiteralPath $secretFile -Raw | ConvertFrom-Json
        $env:ADMIN_USER_PASSWORD = $localConfig.ADMIN_USER_PASSWORD
    }
}
if (-not $env:ADMIN_USER_PASSWORD) {
    throw 'Set ADMIN_USER_PASSWORD or configure it in the existing API user secrets before starting the local database.'
}

$processes = @{}
if (Test-Path (Join-Path $runtimeDir 'processes.json')) {
    $savedProcesses = Get-Content (Join-Path $runtimeDir 'processes.json') -Raw | ConvertFrom-Json
    foreach ($entry in $savedProcesses.PSObject.Properties) { $processes[$entry.Name] = $entry.Value }
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 5001 -ErrorAction SilentlyContinue)) {
    $api = Start-Process -FilePath (Get-Command dotnet).Source -ArgumentList @('run', '--no-launch-profile', '--project', 'API.csproj', '--urls', 'https://localhost:5001') -WorkingDirectory (Join-Path $repoRoot 'API') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'api.log') -RedirectStandardError (Join-Path $runtimeDir 'api-error.log') -PassThru
    $processes.api = $api.Id
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 4200 -ErrorAction SilentlyContinue)) {
    $client = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('node_modules/@angular/cli/bin/ng.js', 'serve', '--host', 'localhost', '--port', '4200', '--ssl', 'false') -WorkingDirectory (Join-Path $repoRoot 'client') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'client.log') -RedirectStandardError (Join-Path $runtimeDir 'client-error.log') -PassThru
    $processes.client = $client.Id
}
$processes | ConvertTo-Json | Set-Content (Join-Path $runtimeDir 'processes.json')
Write-Output 'Noli is starting at http://localhost:4200 (API: https://localhost:5001).'
Write-Output "Logs: $runtimeDir"
