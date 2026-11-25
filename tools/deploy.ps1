# Deploy ke Vercel production dari salinan proyek tanpa folder .git.
# Vercel Hobby menolak deploy bila email penulis commit git tidak terdaftar di akun Vercel,
# jadi skrip ini menyalin file ke folder sementara lalu deploy dari sana.
# Pemakaian (dari folder proyek):  .\tools\deploy.ps1
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $PSScriptRoot
$tmp = Join-Path $env:TEMP ('hmps-deploy-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
robocopy $src $tmp /E /NFL /NDL /NJH /NJS /XD .git node_modules _src data /XF .env* | Out-Null
Push-Location $tmp
try { npx -y vercel@latest deploy --prod --yes }
finally { Pop-Location; Remove-Item -Recurse -Force $tmp }
