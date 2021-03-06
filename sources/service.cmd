  @echo off

  echo Seanox XML-Micro-Exchange [Version 0.0.0 00000000]
  echo Copyright (C) 0000 Seanox Software Solutions

  cd /D "%~dp0"
  set home=%CD%

  :: The service can only be created as an Administrator.
  net session >nul 2>&1
  if not %errorLevel% == 0 goto usage

:main
  set service_name=xmex
  set nssm=%home%\nssm\nssm.exe

  if "%1" == "install"   goto install
  if "%1" == "update"    goto install
  if "%1" == "uninstall" goto uninstall

:usage
  echo.
  echo usage: %~nx0 [command]
  echo.
  echo    install
  echo    update
  echo    uninstall

  net session >nul 2>&1
  if not %errorLevel% == 0 (
    echo.
    echo This script must run as Administrator.
  )
  
  exit /B 0

:install
  echo.
  echo ENVIRONMENT: Add variable LIBXML2_HOME
  echo     %home%\libxml2

  setx /M LIBXML2_HOME %home%\libxml2 >> service.log

  sc query %service_name% >nul 2>&1
  if "%errorLevel%"=="0" (
    echo.
    echo SERVICE: Service is still present and will be stopped and removed
    sc stop %service_name% >nul
    sc delete %service_name%
  )

  set lastError=
  set lastError=%errorLevel%

  :: Full access for the NetworkService to the AppDirectory
  echo.
  echo PERMISSIONS: Service runs as NetworkService and permits full access to the AppDirectory
  echo     %home%
  icacls.exe %home% /grant "NetworkService":F /T /Q
  if not "%lastError%" == "%errorLevel%" goto error

  :: Configuration from service 
  echo.
  echo SERVICE: Service will be created and configured
  %nssm% install %service_name% nssm install %SERVICE_NAME% "%home%\node\node.exe"
  %nssm% set %service_name% DisplayName   Seanox XMEX
  %nssm% set %service_name% Description   XML Micro Exchange
  %nssm% set %service_name% AppDirectory  %home%
  %nssm% set %service_name% AppParameters service.js
  %nssm% set %service_name% AppStdout     %home%\logs\service-output.log
  %nssm% set %service_name% AppStderr     %home%\logs\service-error.log
  %nssm% set %service_name% Start         SERVICE_AUTO_START
  %nssm% set %service_name% ObjectName    NetworkService
  ::%nssm% set %service_name% Type SERVICE_WIN32_OWN_PROCESS

  if not "%lastError%" == "%errorLevel%"=="0" goto error

  echo.
  echo INSTALL: Successfully completed

  echo.
  echo SERVICE: Service will be started
  net start %service_name%
  if not "%lastError%" == "%errorLevel%"=="0" goto error

  exit /B 0

:uninstall
  echo.
  echo ENVIRONMENT: Remove variable LIBXML2_HOME
  if not "%LIBXML2_HOME%" == "" (
    reg delete "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /F /V LIBXML2_HOME >nul 2>&1
    setx /M LIBXML2_HOME "" >nul 2>&1
  )

  sc query %service_name% >nul 2>&1
  if "%errorLevel%"=="0" (
    echo.
    echo SERVICE: Service is still present and will be stopped and removed
    sc stop %service_name% >nul   
    sc delete %service_name%   
  ) else (
    echo.
    echo SERVICE: Service has already been removed
  )

  echo.
  echo UNINSTALL: Successfully completed
  exit /B 0

:error
  echo An unexpected error occurred.
  echo The script was canceled.
  exit /B 0