param(
  [Parameter(Mandatory=$true)][string]$Src,
  [Parameter(Mandatory=$true)][string]$Dst,
  [int]$Quality = 22,
  [int]$Speed = 6,
  [int]$Jobs = 4
)

Write-Host "Source: $Src"
Write-Host "Destination: $Dst"

if (-not (Test-Path $Src)) {
  throw "Source path does not exist: $Src"
}

New-Item -ItemType Directory -Force -Path $Dst | Out-Null

$avifenc = (Get-Command avifenc.exe -ErrorAction SilentlyContinue)?.Source
if (-not $avifenc) {
  # Try avifenc.exe in source
  $candidate = Join-Path $Src 'avifenc.exe'
  if (Test-Path $candidate) { $avifenc = $candidate }
}
if (-not $avifenc) {
  # Try avifenc.exe in parent
  $parent = Split-Path -Path $Src -Parent
  $candidateParent = Join-Path $parent 'avifenc.exe'
  if (Test-Path $candidateParent) { $avifenc = $candidateParent }
}
if (-not $avifenc) {
  # Also handle common typo 'afifenc.exe' in source/parent
  $candidateTypo = Join-Path $Src 'afifenc.exe'
  if (Test-Path $candidateTypo) { $avifenc = $candidateTypo }
}
if (-not $avifenc) {
  $candidateTypoParent = Join-Path (Split-Path -Path $Src -Parent) 'afifenc.exe'
  if (Test-Path $candidateTypoParent) { $avifenc = $candidateTypoParent }
}
if (-not $avifenc) {
  throw 'avifenc.exe (or afifenc.exe) not found in PATH, source folder, or parent of source.'
}

Write-Host "Using avifenc: $avifenc"

Get-ChildItem -Path $Src -Filter *.png -File | ForEach-Object {
  $out = Join-Path $Dst ($_.BaseName + '.avif')
  Write-Host "Converting: $($_.FullName) -> $out"
  & $avifenc -q $Quality --yuv 444 --speed $Speed --jobs $Jobs $_.FullName $out
}

Write-Host "Done."


