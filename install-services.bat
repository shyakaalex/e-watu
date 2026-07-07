@echo off
cd C:\Users\hp\e-watu
echo Installing root dependencies...
call "C:\Program Files\nodejs\npm.cmd" install

echo.
echo Installing identity-service dependencies...
call "C:\Program Files\nodejs\npm.cmd" install --prefix services/identity-service

echo.
echo Installing platform-service dependencies...
call "C:\Program Files\nodejs\npm.cmd" install --prefix services/platform-service

echo.
echo Installing recruitment-service dependencies...
call "C:\Program Files\nodejs\npm.cmd" install --prefix services/recruitment-service

echo.
echo Installing notification-service dependencies...
call "C:\Program Files\nodejs\npm.cmd" install --prefix services/notification-service

echo.
echo Installing document-service dependencies...
call "C:\Program Files\nodejs\npm.cmd" install --prefix services/document-service

echo.
echo Installing web dependencies...
call "C:\Program Files\nodejs\npm.cmd" install --prefix web

echo.
echo All dependencies installed!
