param(
  [Parameter(Mandatory=$true)][string]$Pdf,
  [Parameter(Mandatory=$true)][string]$OutDir,
  [int]$Dpi = 400,
  [ValidateSet('png','jpeg','tiff')][string]$Format = 'png',
  [string]$PdftoppmPath
)

Write-Host "PDF: $Pdf"
Write-Host "Output: $OutDir"
Write-Host "DPI: $Dpi  Format: $Format"

if (-not (Test-Path $Pdf)) { throw "PDF not found: $Pdf" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$pdftoppm = $null
if ($PdftoppmPath -and (Test-Path $PdftoppmPath)) {
  $pdftoppm = $PdftoppmPath
} else {
  $pdftoppm = (Get-Command pdftoppm -ErrorAction SilentlyContinue)?.Source
  if (-not $pdftoppm) {
    $candidates = @(
      'C:\ProgramData\chocolatey\bin\pdftoppm.exe',
      'C:\Program Files\poppler*\Library\bin\pdftoppm.exe',
      'C:\Program Files\poppler*\bin\pdftoppm.exe',
      'C:\Program Files (x86)\poppler*\Library\bin\pdftoppm.exe',
      'C:\Program Files (x86)\poppler*\bin\pdftoppm.exe'
    )
    foreach ($pat in $candidates) {
      $found = Get-ChildItem -Path $pat -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($found) { $pdftoppm = $found.FullName; break }
    }
  }
}
if (-not $pdftoppm) { throw 'pdftoppm not found. Provide -PdftoppmPath or add to PATH.' }

$prefix = Join-Path $OutDir ([System.IO.Path]::GetFileNameWithoutExtension($Pdf) + '_Page')

$fmtSwitch = '-png'
switch ($Format) {
  'jpeg' { $fmtSwitch = '-jpeg' }
  'tiff' { $fmtSwitch = '-tiff' }
}

& $pdftoppm $fmtSwitch -r $Dpi -aa yes -aaVector yes -- "$Pdf" "$prefix"

Write-Host "Done."


