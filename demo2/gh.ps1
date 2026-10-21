# Acceso a la API de GitHub sin tener git instalado en el PC.
# El token se lee del Administrador de Credenciales de Windows (la misma
# credencial que usa "git credential fill"), en memoria: nunca se escribe a disco.
#
#   .\demo2\gh.ps1 user
#   .\demo2\gh.ps1 api GET /repos/lenz010101/mi-video
#   .\demo2\gh.ps1 api POST /repos/lenz010101/mi-video/actions/workflows/render.yml/dispatches '{"ref":"demo-premium","inputs":{...}}'

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

function Get-GhToken {
  $ptr = [IntPtr]::Zero
  if (-not [GhCred]::CredRead("git:https://github.com", 1, 0, [ref]$ptr)) {
    throw "No hay credencial de GitHub en el Administrador de Credenciales."
  }
  $c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][GhCred+CREDENTIAL])
  $bytes = New-Object byte[] $c.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bytes, 0, $c.CredentialBlobSize)
  $token = [Text.Encoding]::Unicode.GetString($bytes).TrimEnd([char]0)
  [GhCred]::CredFree($ptr)
  return $token
}

function Invoke-Gh {
  param(
    [ValidateSet('GET','POST','PATCH','PUT','DELETE')][string]$Method = 'GET',
    [Parameter(Mandatory=$true)][string]$Path,
    [string]$Body,
    [string]$Raw,
    [switch]$Download
  )
  $token = Get-GhToken
  $headers = @{ 'User-Agent' = 'opencode-gh'; 'Authorization' = "token $token"; 'Accept' = 'application/vnd.github+json' }
  $url = if ($Path -like 'http*') { $Path } else { "https://api.github.com$Path" }
  $params = @{ Uri = $url; Headers = $headers; Method = $Method; TimeoutSec = 60 }
  if ($Body) { $params.Body = $Body; $params.ContentType = 'application/json' }
  if ($Raw) { $params.OutFile = $Raw }
  $res = Invoke-WebRequest @params -UseBasicParsing
  if ($Download) { return $null }
  if ($res.Content) { return $res.Content | ConvertFrom-Json }
  return $null
}

switch ($args[0]) {
  'user' {
    (Invoke-Gh -Method GET -Path '/user') | Select-Object login, name, id | Format-List
  }
  'api' {
    $m = if ($args[1]) { $args[1] } else { 'GET' }
    $body = if ($args[3]) { $args[3] } else { $null }
    $r = Invoke-Gh -Method $m -Path $args[2] -Body $body
    if ($r) { $r | ConvertTo-Json -Depth 6 } else { "OK (sin cuerpo)" }
  }
  default {
    "Uso: gh.ps1 user | gh.ps1 api <GET|POST|PATCH|PUT|DELETE> <ruta> [cuerpo-json]"
  }
}
