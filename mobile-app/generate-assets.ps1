Add-Type -AssemblyName System.Drawing

$srcLogoPath = "$PSScriptRoot\..\web-app\public\octobyte-logo.png"
if (-not (Test-Path $srcLogoPath)) {
    throw "Source logo not found at $srcLogoPath"
}

$srcImage = [System.Drawing.Image]::FromFile($srcLogoPath)
$resDir = "$PSScriptRoot\android\app\src\main\res"
$bgCream = [System.Drawing.Color]::FromArgb(247, 243, 232) # #F7F3E8
$bgWhite = [System.Drawing.Color]::White

function Create-SquareIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Fill background with warm white/cream
    $brush = New-Object System.Drawing.SolidBrush $bgCream
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $brush.Dispose()

    # Calculate aspect ratio to fit inside 85% of icon size
    $pad = [int]($size * 0.08)
    $targetW = $size - ($pad * 2)
    $targetH = $size - ($pad * 2)

    $ratio = [Math]::Min($targetW / $srcImage.Width, $targetH / $srcImage.Height)
    $w = [int]($srcImage.Width * $ratio)
    $h = [int]($srcImage.Height * $ratio)
    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)

    $g.DrawImage($srcImage, $x, $y, $w, $h)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Create-RoundIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)

    $brush = New-Object System.Drawing.SolidBrush $bgCream
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $brush.Dispose()

    $pad = [int]($size * 0.12)
    $targetW = $size - ($pad * 2)
    $targetH = $size - ($pad * 2)

    $ratio = [Math]::Min($targetW / $srcImage.Width, $targetH / $srcImage.Height)
    $w = [int]($srcImage.Width * $ratio)
    $h = [int]($srcImage.Height * $ratio)
    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)

    $g.DrawImage($srcImage, $x, $y, $w, $h)
    $path.Dispose()
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Create-ForegroundIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Transparent background for adaptive icon foreground
    $g.Clear([System.Drawing.Color]::Transparent)

    # Safe zone for adaptive icon foreground is inner 66%
    $safeSize = [int]($size * 0.65)
    $ratio = [Math]::Min($safeSize / $srcImage.Width, $safeSize / $srcImage.Height)
    $w = [int]($srcImage.Width * $ratio)
    $h = [int]($srcImage.Height * $ratio)
    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)

    $g.DrawImage($srcImage, $x, $y, $w, $h)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Create-SplashScreen([int]$width, [int]$height, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Warm cream background
    $brush = New-Object System.Drawing.SolidBrush $bgCream
    $g.FillRectangle($brush, 0, 0, $width, $height)
    $brush.Dispose()

    # Scale logo nicely in center (around 45% of narrower dimension)
    $minDim = [Math]::Min($width, $height)
    $targetSize = [int]($minDim * 0.50)
    $ratio = [Math]::Min($targetSize / $srcImage.Width, $targetSize / $srcImage.Height)
    $w = [int]($srcImage.Width * $ratio)
    $h = [int]($srcImage.Height * $ratio)
    $x = [int](($width - $w) / 2)
    $y = [int](($height - $h) / 2)

    $g.DrawImage($srcImage, $x, $y, $w, $h)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# 1. Generate Mipmap Icons
$iconSizes = @{
    "mipmap-mdpi"    = @{ icon = 48;  fg = 108 }
    "mipmap-hdpi"    = @{ icon = 72;  fg = 162 }
    "mipmap-xhdpi"   = @{ icon = 96;  fg = 216 }
    "mipmap-xxhdpi"  = @{ icon = 144; fg = 324 }
    "mipmap-xxxhdpi" = @{ icon = 192; fg = 432 }
}

foreach ($folder in $iconSizes.Keys) {
    $dir = Join-Path $resDir $folder
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    
    $info = $iconSizes[$folder]
    Create-SquareIcon $info.icon (Join-Path $dir "ic_launcher.png")
    Create-RoundIcon  $info.icon (Join-Path $dir "ic_launcher_round.png")
    Create-ForegroundIcon $info.fg (Join-Path $dir "ic_launcher_foreground.png")
    Write-Host "Generated launcher icons for $folder"
}

# 2. Generate Splash Screens
$splashSizes = @{
    "drawable"               = @{ w = 480;  h = 800 }
    "drawable-port-mdpi"     = @{ w = 320;  h = 480 }
    "drawable-port-hdpi"     = @{ w = 480;  h = 800 }
    "drawable-port-xhdpi"    = @{ w = 720;  h = 1280 }
    "drawable-port-xxhdpi"   = @{ w = 960;  h = 1600 }
    "drawable-port-xxxhdpi"  = @{ w = 1280; h = 1920 }
    "drawable-land-mdpi"     = @{ w = 480;  h = 320 }
    "drawable-land-hdpi"     = @{ w = 800;  h = 480 }
    "drawable-land-xhdpi"    = @{ w = 1280; h = 720 }
    "drawable-land-xxhdpi"   = @{ w = 1600; h = 960 }
    "drawable-land-xxxhdpi"  = @{ w = 1920; h = 1280 }
}

foreach ($folder in $splashSizes.Keys) {
    $dir = Join-Path $resDir $folder
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $dim = $splashSizes[$folder]
    Create-SplashScreen $dim.w $dim.h (Join-Path $dir "splash.png")
    Write-Host "Generated splash for $folder ($($dim.w)x$($dim.h))"
}

$srcImage.Dispose()
Write-Host "All assets generated successfully!"

