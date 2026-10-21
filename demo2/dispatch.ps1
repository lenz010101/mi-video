# Lanza un render FINAL en la nube y espera a que termine.
#   .\demo2\dispatch.ps1 -Workflow render.yml -Composition compositions/x.html -Filename x.mp4
# Siempre a 30 fps y calidad "high" (el MP4 de entrega). Para una revision
# rapida, pasa -Qc no y baja el peso a mano: no hay pasos intermedios.
# El token se lee del Administrador de Credenciales (el mismo que usa git).
param(
  [string]$Workflow = 'render.yml',
  [string]$Composition = '',
  [string]$Filename = 'video.mp4',
  [string]$Repo = 'lenz010101/mi-video',
  [string]$Branch = 'demo-premium',
  [switch]$SinQc,
  [switch]$NoWait,
  [ValidateSet('video', 'frames')][string]$Modo = 'video',
  [string]$At = '1.5,6.8,12,17.2,22.5,28'
)
$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class GhCred {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags; public uint Type; public IntPtr TargetName; public IntPtr Comment;
    public long LastWritten; public uint CredentialBlobSize; public IntPtr CredentialBlob;
    public uint Persist; public uint AttributeCount; public IntPtr Attributes;
    public IntPtr TargetAlias; public IntPtr UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool CredRead(string target, uint type, uint flags, out IntPtr credPtr);
  [DllImport("advapi32.dll", EntryPoint="CredFree")]
  public static extern void CredFree(IntPtr credPtr);
}
"@
$ptr = [IntPtr]::Zero
[GhCred]::CredRead("git:https://github.com", 1, 0, [ref]$ptr) | Out-Null
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][GhCred+CREDENTIAL])
$bb = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bb, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::Unicode.GetString($bb).TrimEnd([char]0)
[GhCred]::CredFree($ptr)

$H = @{ 'User-Agent' = 'opencode'; 'Authorization' = "token $token"; 'Accept' = 'application/vnd.github+json' }
function Api([string]$m, [string]$p, $body) {
  $par = @{ Uri = "https://api.github.com/repos/$Repo$p"; Headers = $H; Method = $m; TimeoutSec = 90 }
  if ($null -ne $body) { $par.Body = ($body | ConvertTo-Json -Depth 10 -Compress); $par.ContentType = 'application/json' }
  (Invoke-WebRequest @par -UseBasicParsing).Content | ConvertFrom-Json
}

$wid = (Api GET "/actions/workflows/$Workflow").id
$fps = '30'; $quality = 'high'
$qc = if ($SinQc) { 'no' } else { 'si' }

$isMix = $Workflow -like 'render-mix*'
if ($isMix) {
  $inputs = @{ filename = $Filename; quality = $quality; frames = 'no'; fps = $fps; qc = $qc; mode = $Modo; at = $At }
} else {
  $inputs = @{ quality = $quality; fps = $fps; filename = $Filename; format = 'mp4'; workers = '1'; frames = 'no'; qc = $qc; composition = $Composition; mode = $Modo; at = $At }
}
Api POST "/actions/workflows/$Workflow/dispatches" @{ ref = $Branch; inputs = $inputs } | Out-Null
Write-Output "dispatch: $Composition -> $Filename (modo=$Modo fps=$fps quality=$quality qc=$qc)"

$run = $null
for ($i = 0; $i -lt 20 -and -not $run; $i++) {
  Start-Sleep -Seconds 6
  $list = Api GET "/actions/runs?branch=$Branch&per_page=8"
  $run = $list.workflow_runs | Where-Object { $_.status -ne 'completed' -and $_.workflow_id -eq $wid } | Select-Object -First 1
}
if (-not $run) { throw "no arranco el run" }
Write-Output "run $($run.id) en marcha"
if ($NoWait) { Write-Output "RUNID=$($run.id)"; exit 0 }
$t0 = Get-Date
$last = ''
while ($true) {
  Start-Sleep -Seconds 15
  $r = Api GET "/actions/runs/$($run.id)"
  $job = (Api GET "/actions/runs/$($run.id)/jobs?per_page=10").jobs[0]
  $step = ($job.steps | Where-Object { $_.status -eq 'in_progress' } | Select-Object -First 1).name
  if ($step -ne $last) { Write-Output ("  {0,4}s  {1}" -f [int]((Get-Date) - $t0).TotalSeconds, $step); $last = $step }
  if ($r.status -eq 'completed') { break }
  if (((Get-Date) - $t0).TotalMinutes -gt 35) { throw "timeout" }
}
Write-Output "conclusion: $($r.conclusion) en $([int]((Get-Date) - $t0).TotalSeconds) s"
Write-Output "RUNID=$($run.id)"
if ($r.conclusion -ne 'success') {
  $job2 = (Api GET "/actions/runs/$($run.id)/jobs?per_page=10").jobs[0]
  $job2.steps | Where-Object { $_.conclusion -eq 'failure' } | ForEach-Object { Write-Output "FALLO: $($_.name)" }
  exit 1
}
