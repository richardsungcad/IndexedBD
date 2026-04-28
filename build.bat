@echo off
REM Build Script for Richard Tools Hub APK
REM This script sets up and builds the Cordova mobile application

echo ==========================================
echo Richard Tools Hub - Build Script
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Java SDK is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java SDK is not installed or not in PATH
    echo Please install Java SDK
    pause
    exit /b 1
)

REM Check if Android SDK is installed
if not exist "%ANDROID_SDK_ROOT%" (
    echo ERROR: Android SDK is not installed
    echo Please set ANDROID_SDK_ROOT environment variable
    pause
    exit /b 1
)

echo.
echo Step 1: Installing Node dependencies...
call npm install

echo.
echo Step 2: Installing Cordova globally...
call npm install -g cordova

echo.
echo Step 3: Adding Android platform...
call cordova platform add android

echo.
echo Step 4: Adding required plugins...
call cordova plugin add cordova-plugin-camera
call cordova plugin add cordova-plugin-file
call cordova plugin add cordova-plugin-file-transfer
call cordova plugin add cordova-plugin-splashscreen
call cordova plugin add cordova-plugin-dialogs

echo.
echo Step 5: Building APK...
call cordova build android --release

echo.
echo ==========================================
echo Build completed successfully!
echo APK file location:
echo platforms\android\app\build\outputs\apk\release\app-release.apk
echo ==========================================
echo.
pause
