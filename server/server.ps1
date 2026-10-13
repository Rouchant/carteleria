# Servidor HTTP nativo de Windows (sin Node ni dependencias) usando .NET HttpListener
$port = 3000
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".ico"   = "image/x-icon"
    ".svg"   = "image/svg+xml"
    ".ttf"   = "font/ttf"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
}

try {
    $listener.Start()
    Write-Host "Servidor de Carteleria iniciado en http://localhost:$port" -ForegroundColor Green
    Write-Host "Presiona Ctrl+C en esta ventana para detener el servidor." -ForegroundColor Yellow
    Start-Process "http://localhost:$port"
} catch {
    Write-Warning "No se pudo iniciar listener en puerto $($port): $_"
    Start-Process "$root\index.html"
    exit
}

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
            if ($urlPath -eq "/" -or $urlPath -eq "") { $urlPath = "/index.html" }
            $cleanRel = $urlPath.TrimStart("/").Replace("/", "\")
            $localPath = Join-Path $root $cleanRel

            if (-not (Test-Path $localPath -PathType Leaf)) {
                $fallback = Join-Path $root ("assets\" + $cleanRel)
                if (Test-Path $fallback -PathType Leaf) {
                    $localPath = $fallback
                }
            }

            if (Test-Path $localPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $mime = $mimeTypes[$ext]
                if (-not $mime) { $mime = "application/octet-stream" }
                $response.ContentType = $mime
                $response.AddHeader("Cache-Control", "no-cache")
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Archivo no encontrado")
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
        } catch {
            # Ignorar desconexiones rapidas del navegador
        }
    }
} finally {
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
        $listener.Close()
    }
}
