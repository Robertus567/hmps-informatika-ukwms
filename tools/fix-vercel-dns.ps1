# Menambahkan entri hosts untuk domain Vercel supaya Vercel CLI tidak timeout
# (DNS IPv6/AAAA di jaringan ini butuh ~12 detik, CLI keburu timeout di 10 detik).
# Jalankan di PowerShell "Run as Administrator":
#   & "C:\Coba Program Semester 5\hmps-inf-web\tools\fix-vercel-dns.ps1"
# Untuk menghapus lagi:
#   & "C:\Coba Program Semester 5\hmps-inf-web\tools\fix-vercel-dns.ps1" -Remove
param([switch]$Remove)

$hosts = "$env:SystemRoot\System32\drivers\etc\hosts"
$marker = "# vercel-cli-fix"
$lines = Get-Content $hosts | Where-Object { $_ -notmatch [regex]::Escape($marker) }

if (-not $Remove) {
  $lines += "76.76.21.21 api.vercel.com $marker"
  $lines += "64.239.123.193 vercel.com $marker"
}

Set-Content -Path $hosts -Value $lines -Encoding ascii
ipconfig /flushdns | Out-Null
if ($Remove) { "Entri Vercel dihapus dari hosts." } else { "Entri Vercel ditambahkan ke hosts. Sekarang jalankan: npx vercel@latest login" }
