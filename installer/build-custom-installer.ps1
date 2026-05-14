$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'

if (-not (Test-Path $csc)) {
  throw "C# compiler not found: $csc"
}

function Invoke-External {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $global:LASTEXITCODE = 0
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

Push-Location $root
try {
  Invoke-External { npm run build } 'npm run build'
  Invoke-External { npx electron-builder --dir --win } 'electron-builder --dir'

  $customDir = Join-Path $root 'build\custom-installer'
  New-Item -ItemType Directory -Force -Path $customDir | Out-Null

  $payload = Join-Path $customDir 'payload.zip'
  Remove-Item -LiteralPath $payload -Force -ErrorAction SilentlyContinue
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    (Join-Path $root 'release\win-unpacked'),
    $payload,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
  )

  $uninstaller = Join-Path $customDir 'KuroLauncherUninstaller.exe'
  Invoke-External { & $csc `
    /nologo `
    /target:winexe `
    /platform:x64 `
    /optimize+ `
    /win32icon:logo\KuroLauncher.ico `
    /win32manifest:installer\KuroSetup.exe.manifest `
    /out:$uninstaller `
    /resource:logo\KuroLauncher.png,logo.png `
    /reference:System.Windows.Forms.dll `
    /reference:System.Drawing.dll `
    /reference:Microsoft.CSharp.dll `
    installer\KuroSetupShared.cs `
    installer\KuroUninstaller.cs } 'compile uninstaller'

  $installer = Join-Path $root 'release\KuroLauncher-Setup-0.4.0-x64.exe'
  Invoke-External { & $csc `
    /nologo `
    /target:winexe `
    /platform:x64 `
    /optimize+ `
    /win32icon:logo\KuroLauncher.ico `
    /win32manifest:installer\KuroSetup.exe.manifest `
    /out:$installer `
    /resource:logo\KuroLauncher.png,logo.png `
    /resource:$payload,payload.zip `
    /resource:$uninstaller,uninstaller.exe `
    /reference:System.Windows.Forms.dll `
    /reference:System.Drawing.dll `
    /reference:Microsoft.CSharp.dll `
    /reference:System.IO.Compression.dll `
    /reference:System.IO.Compression.FileSystem.dll `
    installer\KuroSetupShared.cs `
    installer\KuroInstaller.cs } 'compile installer'

  $exe = Get-Item $installer
  $sha512 = [System.Security.Cryptography.SHA512]::Create()
  $stream = [System.IO.File]::OpenRead($exe.FullName)
  try {
    $hashBytes = $sha512.ComputeHash($stream)
  }
  finally {
    $stream.Dispose()
    $sha512.Dispose()
  }
  $sha = [Convert]::ToBase64String($hashBytes)
  $date = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
  $latest = @(
    'version: 0.4.0'
    'files:'
    '  - url: KuroLauncher-Setup-0.4.0-x64.exe'
    ('    sha512: {0}' -f $sha)
    ('    size: {0}' -f $exe.Length)
    'path: KuroLauncher-Setup-0.4.0-x64.exe'
    ('sha512: {0}' -f $sha)
    ("releaseDate: '{0}'" -f $date)
  )
  Set-Content -Path (Join-Path $root 'release\latest.yml') -Value $latest -Encoding UTF8

  Write-Host "Custom installer built: $($exe.FullName)"
  Write-Host "Size: $($exe.Length) bytes"
}
finally {
  Pop-Location
}
