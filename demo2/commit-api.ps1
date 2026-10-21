# Sube ficheros al repo por la API de GitHub (sin git instalado).
# Uso: commit-api.ps1 <branch> <mensaje> <ruta1> <ruta2> ...
param(
  [Parameter(Mandatory=$true)][string]$Branch,
  [Parameter(Mandatory=$true)][string]$Message,
  [Parameter(Mandatory=$true)][string[]]$Paths
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class GhCred2 {
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
if (-not [GhCred2]::CredRead("git:https://github.com", 1, 0, [ref]$ptr)) { throw "sin credencial" }
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][GhCred2+CREDENTIAL])
$bb = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bb, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::Unicode.GetString($bb).TrimEnd([char]0)
[GhCred2]::CredFree($ptr)

$H = @{ 'User-Agent'='opencode'; 'Authorization'="token $token"; 'Accept'='application/vnd.github+json' }
function Api([string]$m, [string]$p, $body) {
  $par = @{ Uri = "https://api.github.com$p"; Headers = $H; Method = $m; TimeoutSec = 90 }
  if ($null -ne $body) { $par.Body = ($body | ConvertTo-Json -Depth 10 -Compress); $par.ContentType = 'application/json' }
  (Invoke-WebRequest @par -UseBasicParsing).Content | ConvertFrom-Json
}

$repo = 'lenz010101/mi-video'
$ref = Api GET "/repos/$repo/git/ref/heads/$Branch"
$headSha = $ref.object.sha
$headCommit = Api GET "/repos/$repo/git/commits/$headSha"
$baseTree = $headCommit.tree.sha
Write-Output "rama=$Branch head=$headSha tree=$baseTree"

$entries = @()
$fileList = @()
foreach ($p in $Paths) {
  $full = Join-Path $PWD $p
  if (-not (Test-Path -LiteralPath $full)) { throw "no existe: $p" }
  if ((Get-Item -LiteralPath $full).PSIsContainer) {
    $fileList += Get-ChildItem -LiteralPath $full -Recurse -File | ForEach-Object { $_.FullName }
  } else {
    $fileList += $full
  }
}
foreach ($full in $fileList) {
  $rel = $full.Substring($PWD.Path.Length + 1).Replace('\','/')
  $bytes = [IO.File]::ReadAllBytes($full)
  $b64 = [Convert]::ToBase64String($bytes)
  $blob = Api POST "/repos/$repo/git/blobs" @{ content = $b64; encoding = 'base64' }
  Write-Output "blob $rel -> $($blob.sha) ($($bytes.Length) bytes)"
  $entries += @{ path = $rel; mode = '100644'; type = 'blob'; sha = $blob.sha }
}

$tree = Api POST "/repos/$repo/git/trees" @{ base_tree = $baseTree; tree = $entries }
$commit = Api POST "/repos/$repo/git/commits" @{ message = $Message; tree = $tree.sha; parents = @($headSha) }
$updated = Api PATCH "/repos/$repo/git/refs/heads/$Branch" @{ sha = $commit.sha; force = $false }
Write-Output "commit $($commit.sha)"
Write-Output "ref -> $($updated.object.sha)"
