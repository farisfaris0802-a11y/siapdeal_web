@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   SiapDeal - local development server
echo ============================================

where npm >nul 2>&1
if %errorlevel%==0 (
  echo Starting with npm...
  start "SiapDeal Dev" /b npm run dev > dev-server.out.log 2> dev-server.err.log
  goto :ready
)

where bun >nul 2>&1
if %errorlevel%==0 (
  echo Starting with Bun...
  start "SiapDeal Dev" /b bun run dev > dev-server.out.log 2> dev-server.err.log
  goto :ready
)

echo.
echo ERROR: Node.js/npm atau Bun tidak ditemukan di PATH.
echo Install Node.js 20+ dari https://nodejs.org lalu jalankan file ini lagi.
echo.
pause
exit /b 1

:ready
echo.
echo Server dinyalakan di: http://localhost:3000
echo Tunggu 5-10 detik, lalu browser akan terbuka otomatis.
echo Log: dev-server.out.log / dev-server.err.log
echo.
timeout /t 5 >nul
start "" http://localhost:3000
endlocal
