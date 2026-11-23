param(
    [string]$SiteHost = 'homeenergycalcs.com',
    [string]$Key = ''
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not $Key) {
    $publicDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'public'
    $keyFiles = @(Get-ChildItem -LiteralPath $publicDir -Filter '*.txt' -File -ErrorAction SilentlyContinue | Where-Object { $_.BaseName -match '^[0-9a-fA-F]{32}$' })
    if ($keyFiles.Count -eq 0) {
        Write-Output "ERRO: Nenhum arquivo de chave IndexNow (32 hex chars) encontrado em: $publicDir"
        exit 1
    }
    $Key = $keyFiles[0].BaseName
}

$keyLocation = "https://$SiteHost/$Key.txt"
$sitemapUrl = "https://$SiteHost/sitemap.xml"

try {
    $keyResp = Invoke-WebRequest -UseBasicParsing -Uri $keyLocation -TimeoutSec 12
    $remoteKey = ([string]$keyResp.Content).Trim()
    if ([int]$keyResp.StatusCode -ne 200 -or $remoteKey -ne $Key) {
        Write-Output "KEY_NOT_LIVE_YET status=$([int]$keyResp.StatusCode) url=$keyLocation"
        exit 3
    }
} catch {
    $code = 0
    if ($_.Exception.Response) {
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
    }
    Write-Output "KEY_NOT_LIVE_YET status=$code url=$keyLocation err=$($_.Exception.Message)"
    exit 3
}

$smResp = Invoke-WebRequest -UseBasicParsing -Uri $sitemapUrl -TimeoutSec 15
[xml]$xml = $smResp.Content
$urls = @($xml.urlset.url | ForEach-Object { [string]$_.loc } | Where-Object { $_ -and $_.Trim().Length -gt 0 })
if ($urls.Count -eq 0) {
    Write-Output "ERRO: Nenhuma URL encontrada em $sitemapUrl"
    exit 1
}

$payload = @{
    host        = $SiteHost
    key         = $Key
    keyLocation = $keyLocation
    urlList     = $urls
} | ConvertTo-Json -Depth 4 -Compress

$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$req = [System.Net.HttpWebRequest]::Create('https://api.indexnow.org/indexnow')
$req.Method = 'POST'
$req.ContentType = 'application/json; charset=utf-8'
$req.ContentLength = $bytes.Length
$req.Timeout = 15000

$reqStream = $req.GetRequestStream()
$reqStream.Write($bytes, 0, $bytes.Length)
$reqStream.Close()

$statusCode = 0
$respBody = ''
try {
    $resp = [System.Net.HttpWebResponse]$req.GetResponse()
    $statusCode = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $respBody = $reader.ReadToEnd()
    $reader.Close()
    $resp.Close()
} catch [System.Net.WebException] {
    if ($_.Exception.Response) {
        $errResp = [System.Net.HttpWebResponse]$_.Exception.Response
        $statusCode = [int]$errResp.StatusCode
        $reader = New-Object System.IO.StreamReader($errResp.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        $reader.Close()
        $errResp.Close()
    } else {
        Write-Output "INDEXNOW_ERR status=0 err=$($_.Exception.Message)"
        exit 1
    }
}

if ($statusCode -eq 200 -or $statusCode -eq 202) {
    Write-Output "INDEXNOW_OK status=$statusCode urls=$($urls.Count) host=$SiteHost"
    exit 0
}

Write-Output "INDEXNOW_ERR status=$statusCode body=$respBody"
exit 1
