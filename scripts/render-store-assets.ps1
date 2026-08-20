# Render store HTML mockups via headless Chrome/Edge/Brave, then flatten to 24-bit RGB.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$assets = Join-Path $root 'webstore\assets'

$jobs = @(
    @{ Html = 'screenshot-01-hero.html'; Out = 'screenshot-01-hero.png'; W = 1280; H = 800 },
    @{ Html = 'screenshot-02-popup.html'; Out = 'screenshot-02-popup.png'; W = 1280; H = 800 },
    @{ Html = 'screenshot-03-protect.html'; Out = 'screenshot-03-protect.png'; W = 1280; H = 800 },
    @{ Html = 'screenshot-04-settings.html'; Out = 'screenshot-04-settings.png'; W = 1280; H = 800 },
    @{ Html = 'screenshot-05-how.html'; Out = 'screenshot-05-how.png'; W = 1280; H = 800 },
    @{ Html = 'promo-tile-440x280.html'; Out = 'promo-tile-440x280.png'; W = 440; H = 280 },
    @{ Html = 'promo-marquee-1400x560.html'; Out = 'promo-marquee-1400x560.png'; W = 1400; H = 560 }
)

$chromePaths = @(
    "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
    "${env:ProgramFiles}\BraveSoftware\Brave-Browser\Application\brave.exe",
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Chrome, Edge, or Brave not found.' }

function Save-RgbPng([string]$srcPath, [string]$destPath, [int]$w, [int]$h, [System.Drawing.Color]$bg) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $tmp = "$destPath.fixing.png"
    try {
        $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear($bg)
        $g.DrawImage($src, 0, 0, $w, $h)
        $g.Dispose()
        $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    } finally {
        $src.Dispose()
    }
    if (Test-Path $destPath) { Remove-Item $destPath -Force }
    Move-Item -Force $tmp $destPath
}

$bg = [System.Drawing.Color]::FromArgb(22, 19, 15)

foreach ($job in $jobs) {
    $html = Join-Path $assets $job.Html
    $out = Join-Path $assets $job.Out
    $tmp = "$out.rendering.png"
    if (Test-Path $tmp) { Remove-Item $tmp -Force }

    $htmlPath = ((Resolve-Path $html).Path -replace '\\', '/')
    $tmpPath = $tmp -replace '\\', '/'
    $fileUrl = "file:///$htmlPath"

    & $browser @(
        '--headless=new',
        '--disable-gpu',
        '--allow-file-access-from-files',
        '--hide-scrollbars',
        "--window-size=$($job.W),$($job.H)",
        '--virtual-time-budget=3000',
        '--run-all-compositor-stages-before-draw',
        "--screenshot=$tmpPath",
        $fileUrl
    ) | Out-Null

    if (-not (Test-Path $tmp)) { throw "Screenshot missing: $tmp" }
    Save-RgbPng $tmp $out $job.W $job.H $bg
    Remove-Item $tmp -Force
    $img = [System.Drawing.Image]::FromFile($out)
    Write-Host "$($job.Out) $($img.Width)x$($img.Height) $($img.PixelFormat)"
    $img.Dispose()
}

Copy-Item (Join-Path $root 'icons\icon-128.png') (Join-Path $assets 'icon-128.png') -Force
Write-Host 'Copied icon-128.png'
Write-Host 'Done.'
