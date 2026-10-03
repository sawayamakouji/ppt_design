param(
  [Parameter(Mandatory=$true)][string]$PptxPath,
  [Parameter(Mandatory=$true)][string]$OutputDir
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
try {
  $pres = $ppt.Presentations.Open((Resolve-Path $PptxPath).Path, $false, $false, $false)
  try {
    # Export each slide as PNG using the real Windows PowerPoint renderer.
    $pres.Export((Resolve-Path $OutputDir).Path, 'PNG', 1600, 900)
  }
  finally { $pres.Close() }
}
finally { $ppt.Quit() }
Write-Host "Golden PNGs exported to $OutputDir"
