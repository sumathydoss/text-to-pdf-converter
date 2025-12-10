# Simple script to ping Google about your sitemap
# Run this in PowerShell to notify Google of your sitemap

$sitemapUrl = "https://text-to-pdf-converter-kappa.vercel.app/sitemap.xml"
$googlePingUrl = "https://www.google.com/ping?sitemap=$sitemapUrl"

Write-Host "Pinging Google with sitemap URL..."
Write-Host "URL: $googlePingUrl"

try {
    $response = Invoke-WebRequest -Uri $googlePingUrl -Method GET -UseBasicParsing
    Write-Host "Success! Status Code: $($response.StatusCode)"
    Write-Host "Google has been notified of your sitemap."
}
catch {
    Write-Host "Error: $_"
    Write-Host "Try visiting this URL in your browser:"
    Write-Host $googlePingUrl
}
