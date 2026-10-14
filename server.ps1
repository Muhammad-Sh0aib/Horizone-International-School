$root = (Get-Location).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()
Write-Host "Serving $root at http://localhost:8000/"

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $requestedPath = $context.Request.Url.AbsolutePath.TrimStart('/')
  $localPath = if ([string]::IsNullOrWhiteSpace($requestedPath)) { Join-Path $root 'index.html' } else { Join-Path $root $requestedPath }

  if (Test-Path $localPath -PathType Leaf) {
    $content = [System.IO.File]::ReadAllBytes($localPath)
    $ext = [System.IO.Path]::GetExtension($localPath).ToLowerInvariant()
    $mimeTypes = @{
      '.html' = 'text/html; charset=utf-8'
      '.css'  = 'text/css; charset=utf-8'
      '.js'   = 'application/javascript; charset=utf-8'
      '.json' = 'application/json; charset=utf-8'
      '.pdf'  = 'application/pdf'
      '.png'  = 'image/png'
      '.jpg'  = 'image/jpeg'
      '.jpeg' = 'image/jpeg'
      '.gif'  = 'image/gif'
      '.svg'  = 'image/svg+xml'
      '.webp' = 'image/webp'
      '.ico'  = 'image/x-icon'
      '.woff' = 'font/woff'
      '.woff2' = 'font/woff2'
      '.ttf'  = 'font/ttf'
    }
    $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
    $context.Response.ContentType = $mime
    $context.Response.ContentLength64 = $content.Length
    $context.Response.OutputStream.Write($content, 0, $content.Length)
    $context.Response.OutputStream.Close()
  }
  else {
    $body = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
    $context.Response.StatusCode = 404
    $context.Response.ContentType = 'text/plain; charset=utf-8'
    $context.Response.ContentLength64 = $body.Length
    $context.Response.OutputStream.Write($body, 0, $body.Length)
    $context.Response.OutputStream.Close()
  }
}
