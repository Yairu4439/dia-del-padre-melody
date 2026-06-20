$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root "index.html"
$cssPath = Join-Path $root "assets\css\padre.css"
$jsPath = Join-Path $root "assets\js\padre.js"
$outputPath = Join-Path $root "dist\dia_del_padre_para_papa.html"
$utf8 = [System.Text.UTF8Encoding]::new($false)

$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$css = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)
$js = [System.IO.File]::ReadAllText($jsPath, [System.Text.Encoding]::UTF8)

$html = $html.Replace(
  '<link rel="stylesheet" href="assets/css/padre.css">',
  "<style>`r`n$css`r`n</style>"
)

$html = $html.Replace(
  '<script src="assets/js/padre.js"></script>',
  "<script>`r`n$js`r`n</script>"
)

$imagePattern = 'src="assets/images/([^"]+)"'
$html = [regex]::Replace($html, $imagePattern, {
  param($match)

  $relativePath = $match.Groups[1].Value.Replace("/", "\")
  $imagePath = Join-Path (Join-Path $root "assets\images") $relativePath
  $extension = [System.IO.Path]::GetExtension($imagePath).TrimStart(".").ToLowerInvariant()
  $mimeType = if ($extension -eq "jpg") { "jpeg" } else { $extension }
  $base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($imagePath))

  return "src=`"data:image/$mimeType;base64,$base64`""
})

$audioPattern = 'src="assets/audio/([^"]+)"'
$html = [regex]::Replace($html, $audioPattern, {
  param($match)

  $relativePath = $match.Groups[1].Value.Replace("/", "\")
  $audioPath = Join-Path (Join-Path $root "assets\audio") $relativePath
  $extension = [System.IO.Path]::GetExtension($audioPath).TrimStart(".").ToLowerInvariant()
  $mimeType = if ($extension -eq "m4a") { "mp4" } elseif ($extension -eq "aac") { "aac" } else { $extension }
  $base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($audioPath))

  return "src=`"data:audio/$mimeType;base64,$base64`""
})

[System.IO.Directory]::CreateDirectory((Split-Path -Parent $outputPath)) | Out-Null
[System.IO.File]::WriteAllText($outputPath, $html, $utf8)

Write-Host "Archivo generado:"
Write-Host $outputPath
