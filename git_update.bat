@echo off
title SW v0.3 - Git Update & Push
color 0b
echo ========================================================
echo          SW v0.3 - Git Auto-Update & Push Script        
echo ========================================================
echo.

:: Check current git status
echo [1/4] Checking repository status...
git status -s
echo.

:: Stage all changes
echo [2/4] Staging all changes...
git add .
echo Changes staged successfully.
echo.

:: Prompt for commit message
set /p msg="Enter commit message (Press Enter for default 'update SW v0.3'): "
if "%msg%"=="" set msg=update SW v0.3

:: Commit changes
echo.
echo [3/4] Committing changes with message: "%msg%"...
git commit -m "%msg%"
if errorlevel 1 (
    echo.
    echo No new changes detected or commit skipped.
) else (
    echo Commit created successfully.
)
echo.

:: Push to main branch
echo [4/4] Pushing to GitHub (origin/main)...
git push -u origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Push failed! Please check your internet connection or git permissions.
) else (
    echo.
    echo ========================================================
    echo             Git Update & Push Completed!                
    echo ========================================================
)

echo.
pause
