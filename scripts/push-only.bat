@echo off
cd /d "%~dp0.."

set "GIT_EXE="
if exist "C:\Program Files\Git\bin\git.exe" set "GIT_EXE=C:\Program Files\Git\bin\git.exe"
if exist "C:\Program Files (x86)\Git\bin\git.exe" set "GIT_EXE=C:\Program Files (x86)\Git\bin\git.exe"
if defined GIT_EXE goto run
where git >nul 2>nul
if errorlevel 1 goto nogit
set GIT_EXE=git
goto run

:nogit
echo Git not found. Install from https://git-scm.com/download/win
pause
exit /b 1

:run
if not exist .git (
  echo Initializing git...
  "%GIT_EXE%" init
)

"%GIT_EXE%" config user.email 2>nul
if errorlevel 1 (
  echo Setting git user for this repo...
  "%GIT_EXE%" config user.email "swbaek60@gmail.com"
  "%GIT_EXE%" config user.name "swbaek60"
)

echo Adding all files...
"%GIT_EXE%" add .

echo Creating commit...
"%GIT_EXE%" commit -m "Initial commit"
if errorlevel 1 (
  echo No changes to commit - will try to push existing commits.
) else (
  echo Commit done.
)

echo Making sure branch is main...
"%GIT_EXE%" branch -M main

echo Pushing to GitHub...
"%GIT_EXE%" push -u origin main
echo.
if errorlevel 1 (
  echo If login asked: use GitHub username and Personal Access Token as password.
)
pause
