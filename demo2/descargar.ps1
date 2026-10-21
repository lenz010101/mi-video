# Descarga el MP4 de un run de la nube al Escritorio (solo el video, sin QC).
#   .\demo2\descargar.ps1 -RunId 39662913034 -Filename ranking-ref-30s.mp4
param(
  [Parameter(Mandatory=$true)][long]$RunId,
  [string]$Filename = 'video.mp4',
  [string]$Desktop = 'C:\Users\Admin\Desktop',
  [switch]$QC,
  [switch]$Stills
)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class GhCredDl {
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
[GhCredDl]::CredRead("git:https://github.com", 1, 0, [ref]$ptr) | Out-Null
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][GhCredDl+CREDENTIAL])
$bb = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bb, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::Unicode.GetString($bb).TrimEnd([char]0)
[GhCredDl]::CredFree($ptr)
$H = @{ 'User-Agent' = 'opencode'; 'Authorization' = "token $token"; 'Accept' = 'application/vnd.github+json' }
$repo = 'lenz010101/mi-video'
$arts = (Invoke-WebRequest -Uri "https://api.github.com/repos/$repo/actions/runs/$RunId/artifacts" -Headers $H -UseBasicParsing).Content | ConvertFrom-Json
foreach ($a in $arts.artifacts) {
  $esVideo = $a.name -eq 'hyperframes-video'
  $esQC = $a.name -eq 'hyperframes-qc'
  $esStills = $a.name -eq 'hyperframes-stills'
  if ($Stills) {
    if (-not $esStills) { continue }
  } else {
    if (-not $esVideo -and -not $esQC) { continue }
    if ($QC -and -not $esQC) { continue }
    if (-not $QC -and -not $esVideo) { continue }
  }
  $req = [System.Net.HttpWebRequest]::Create($a.archive_download_url)
  $req.UserAgent = 'opencode'; $req.Headers.Add('Authorization', "token $token"); $req.AllowAutoRedirect = $false; $req.Timeout = 60000
  $loc = $req.GetResponse().Headers['Location']
  $req2 = [System.Net.HttpWebRequest]::Create($loc); $req2.UserAgent = 'opencode'; $req2.Timeout = 900000
  $res2 = $req2.GetResponse()
  $zip = Join-Path $env:TEMP ("hd-" + [guid]::NewGuid().ToString().Substring(0,6) + ".zip")
  $fs = [IO.File]::Create($zip); $res2.GetResponseStream().CopyTo($fs); $fs.Close(); $res2.Close()
  $dest = Join-Path $env:TEMP ("hd-" + [guid]::NewGuid().ToString().Substring(0,6))
  Expand-Archive -Force -LiteralPath $zip -DestinationPath $dest
  if ($esStills) {
    $destino = Join-Path $env:TEMP 'stills-last'
    Remove-Item -Recurse -Force $destino -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    Get-ChildItem $dest -Recurse -Filter *.png | ForEach-Object { Copy-Item $_.FullName $destino -Force }
    Write-Output "STILLS -> $destino"
    Get-ChildItem $destino -Filter *.png | ForEach-Object { Write-Output "   $($_.Name)" }
  } elseif ($esVideo) {
    $mp4 = Get-ChildItem $dest -Recurse -Filter *.mp4 | Where-Object { $_.FullName -notlike '*plates*' -and $_.FullName -notlike '*orbes*' } | Select-Object -First 1
    if (-not $mp4) { $mp4 = Get-ChildItem $dest -Recurse -Filter *.mp4 | Select-Object -First 1 }
    Move-Item -Force $mp4.FullName (Join-Path $Desktop $Filename)
    Write-Output "MP4: $(Join-Path $Desktop $Filename) ($([math]::Round($mp4.Length/1MB,1)) MB)"
  } else {
    $hoja = Get-ChildItem $dest -Recurse -Filter "hoja-de-contactos-grande.png" | Select-Object -First 1
    if (-not $hoja) { $hoja = Get-ChildItem $dest -Recurse -Filter "hoja-de-contactos.png" | Select-Object -First 1 }
    if ($hoja) { Copy-Item -Force $hoja.FullName "$env:TEMP\qc-last.png"; Write-Output "QC -> $env:TEMP\qc-last.png" }
  }
  Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
  Remove-Item -Force $zip -ErrorAction SilentlyContinue
}
