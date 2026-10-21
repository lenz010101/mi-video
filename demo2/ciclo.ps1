# CICLO COMPLETO en un comando: valida en local -> sube -> renderiza en la
# nube -> baja el MP4 al Escritorio. Sin pasos manuales y sin renderizar nada
# en el PC (el PC solo valida y descarga).
#
#   .\demo2\ciclo.ps1 -Composition compositions/ranking-ref-30s.html `
#                       -Filename ranking-ref-30s.mp4 -Workflow render-mix.yml `
#                       -Paths compositions/ranking-ref-30s.html
#
# -Paths: ficheros a subir antes de renderizar (si no, no sube nada).
# -SinLint: no lanza el lint de HyperFrames (1 min); el auditor (2 s) siempre.
# -SinQc: sin la verificacion del MP4 en la nube (40 s).
param(
  [string]$Composition = 'compositions/ranking-ref-30s.html',
  [string]$Filename = 'ranking-ref-30s.mp4',
  [string]$Workflow = 'render-mix.yml',
  [string]$Message = '',
  [string[]]$Paths = @(),
  [switch]$SinLint,
  [switch]$SinQc
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$t0 = Get-Date

# ── 1) AUDITORES EN LOCAL (2 s, sin arrancar Chrome) ─────────────────
Write-Output "[1/4] auditor de reglas + sintaxis de los workflows..."
node demo2/audit-rules.mjs
if ($LASTEXITCODE -ne 0) { throw "el auditor ha encontrado problemas: NO se renderiza" }
node demo2/audit-bash.mjs
if ($LASTEXITCODE -ne 0) { throw "un script de bash tiene un error de sintaxis: NO se renderiza" }

# ── 2) LINT DE HYPERFRAMES (1 min; opcional) ─────────────────────────
if (-not $SinLint) {
  Write-Output "[2/4] lint de HyperFrames (1 min)..."
  $lint = (npx --yes hyperframes@0.8.162 lint . --json 2>$null | Out-String)
  try { $o = $lint | ConvertFrom-Json } catch { $o = $null }
  if ($o) {
    # estos errores son esperables: el material se monta en la nube
    $permitidos = @('assets/nuevo/procesado/', 'assets/nuevo/inmo/procesado/',
                    'assets/mezcla/plato-', 'assets/mezcla/voz.m4a')
    $fatal = @()
    foreach ($f in $o.findings) {
      if ($f.severity -ne 'error') { continue }
      $msg = "$($f.message) $($f.file)"
      if (-not ($permitidos | Where-Object { $msg -like "*$_*" })) { $fatal += $f }
    }
    Write-Output "      errores=$(($o.findings | Where-Object { $_.severity -eq 'error' }).Count)  avisos=$(($o.findings | Where-Object { $_.severity -eq 'warning' }).Count)  fatales=$($fatal.Count)"
    if ($fatal.Count -gt 0) {
      $fatal | ForEach-Object { Write-Output "      FATAL: $($_.message)" }
      throw "el lint encuentra errores reales: NO se renderiza"
    }
  } else {
    Write-Output "      (el lint no devolvio JSON; se continua)"
  }
} else {
  Write-Output "[2/4] lint omitido (-SinLint)"
}

# ── 3) SUBIR LOS CAMBIOS (API de GitHub, sin git) ────────────────────
if ($Paths -and $Paths.Count -gt 0) {
  $msg = if ($Message) { $Message } else { "ciclo: $Filename" }
  Write-Output "[3/4] subiendo: $($Paths -join ', ')"
  & "$PSScriptRoot\commit-api.ps1" -Branch 'demo-premium' -Message $msg -Paths $Paths | Select-Object -Last 2
} else {
  Write-Output "[3/4] nada que subir (sin -Paths)"
}

# ── 4) RENDER EN LA NUBE + DESCARGA AL ESCRITORIO ────────────────────
Write-Output "[4/4] render en la nube ($Workflow)..."
$out = & "$PSScriptRoot\dispatch.ps1" -Workflow $Workflow -Composition $Composition -Filename $Filename -SinQc:$SinQc
$out | ForEach-Object { Write-Output $_ }
$runId = ($out | Where-Object { $_ -like 'RUNID=*' }) -replace 'RUNID=',''
if (-not $runId) { throw "no se pudo saber el id del run" }
Write-Output "bajando el MP4 al Escritorio..."
& "$PSScriptRoot\descargar.ps1" -RunId $runId -Filename $Filename

Write-Output ("CICLO COMPLETO en {0} s" -f [int]((Get-Date) - $t0).TotalSeconds)
