@echo off
cd /d "%~dp0"
set "PORTFOLIO_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%PORTFOLIO_PYTHON%" goto bundled
py -3 -c "import http.server" >nul 2>&1
if not errorlevel 1 goto py
python -c "import http.server" >nul 2>&1
if not errorlevel 1 goto python
echo Python is needed for the local preview. You can also upload the website to a static host.
pause
exit /b 1
:bundled
"%PORTFOLIO_PYTHON%" preview.py
goto end
:py
py -3 preview.py
goto end
:python
python preview.py
:end
