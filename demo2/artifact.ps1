# Baja un artifact de un run de la nube (cualquiera) y lo deja en una carpeta.
#   .\demo2\artifact.ps1 -RunId 39691921416 -Nombre informe-vision [-Deste C:\Temp\algo]
param(
  [Parameter(Mandatory=$true)][long]$RunId,
  [string]$Nombre = '',
  [string]$Deste = "$env:TEMP\opencode\artifact"
)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class GhCredArt {
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
[GhCredArt]::CredRead("git:https://github.com", 1, 0, [ref]$ptr) | Out-Null
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][GhCredArt+CREDENTIAL])
$bb = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bb, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::Unicode.GetString($bb).TrimEnd([char]0)
[GhCredArt]::CredFree($ptr)

$H = @{ 'User-Agent' = 'opencode'; 'Authorization' = "token $token"; 'Accept' = 'application/vnd.github+json' }
$repo = 'lenz010101/mi-video'
$arts = (Invoke-WebRequest -Uri "https://api.github.com/repos/$repo/actions/runs/$RunId/artifacts" -Headers $H -UseBasicParsing).Content | ConvertFrom-Json
if (-not $arts.artifacts) { Write-Output 'el run no tiene artifacts'; exit 1 }
$a = if ($Nombre) { $arts.artifacts | Where-Object { $_.name -eq $Nombre } | Select-Object -First 1 } else { $arts.artifacts | Select-Object -First 1 }
if (-not $a) { Write-Output ("no hay el artifact '$Nombre'. Hay: " + (($arts.artifacts | ForEach-Object { $_.name }) -join ', ')); exit 1 }

# descarga: primero pedir la redireccion con la cabecera de autenticacion
$req = [System.Net.HttpWebRequest]::Create($a.archive_download_url)
$req.UserAgent = 'opencode'
$req.Headers.Add('Authorization', "token $token")
$req.AllowAutoRedirect = $false
$req.Timeout = 120000
$loc = $req.GetResponse().Headers['Location']
$req2 = [System.Net.HttpWebRequest]::Create($loc)
$req2.UserAgent = 'opencode'
$req2.Timeout = 900000
$res = $req2.GetResponse()
$zip = Join-Path $env:TEMP ("artifact-" + [guid]::NewGuid().ToString().Substring(0, 6) + ".zip")
$fs = [IO.File]::Create($zip)
$res.GetResponseStream().CopyTo($fs)
$fs.Close()
$res.Close()
Remove-Item -Recurse -Force $Deste -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Deste | Out-Null
Expand-Archive -Force -LiteralPath $zip -DestinationPath $Deste
Remove-Item -Force $zip -ErrorAction SilentlyContinue
Get-ChildItem $Deste -Recurse -File | ForEach-Object {
  Write-Output ("--- " + $_.Name + " ---")
  Get-Content $_.FullName -Raw -Encoding UTF8
}
