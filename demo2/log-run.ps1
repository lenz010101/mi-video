# Trae el log de un run de la nube (texto plano) y muestra las ultimas lineas
# o las que contengan un patron. Sirve para ver por que fallo un paso sin
# tener que abrir el navegador.
#   .\demo2\log-run.ps1 -RunId 39672914920
#   .\demo2\log-run.ps1 -RunId 39672914920 -Patron "snapshot|Error"
param(
  [Parameter(Mandatory=$true)][long]$RunId,
  [string]$Patron = '',
  [int]$Ultimas = 40
)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class GhCredLog {
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
[GhCredLog]::CredRead("git:https://github.com", 1, 0, [ref]$ptr) | Out-Null
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][GhCredLog+CREDENTIAL])
$bb = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bb, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::Unicode.GetString($bb).TrimEnd([char]0)
[GhCredLog]::CredFree($ptr)

$H = @{ 'User-Agent' = 'opencode'; 'Authorization' = "token $token"; 'Accept' = 'application/vnd.github+json' }
$repo = 'lenz010101/mi-video'
$jobs = (Invoke-WebRequest -Uri "https://api.github.com/repos/$repo/actions/runs/$RunId/jobs" -Headers $H -UseBasicParsing).Content | ConvertFrom-Json
$log = "$env:TEMP\opencode\run-$RunId.log"
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
foreach ($j in $jobs.jobs) {
  Invoke-WebRequest -Uri "https://api.github.com/repos/$repo/actions/jobs/$($j.id)/logs" -Headers $H -OutFile $log -UseBasicParsing
  $lineas = Get-Content $log
  if ($Patron) {
    $lineas | Select-String -Pattern $Patron | Select-Object -Last $Ultimas
  } else {
    $lineas | Select-Object -Last $Ultimas
  }
}
