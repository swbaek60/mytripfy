@echo off
cd /d "%~dp0.."
set NODE_ARGS=--env-file=.env.local
if exist .env.sns set NODE_ARGS=%NODE_ARGS% --env-file=.env.sns
node %NODE_ARGS% scripts\marketing-agent\run-daily.mjs %*
exit /b %ERRORLEVEL%
