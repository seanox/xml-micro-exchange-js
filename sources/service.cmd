  @echo off

  echo Seanox XML-Micro-Exchange [Version 1.4.1 20220717]
  echo Copyright (C) 2022 Seanox Software Solutions
  echo.

  cd /D "%~dp0"
  set home=%cd%

  SetLocal EnableDelayedExpansion

  :: The service can only be created as an Administrator.
  net session >nul 2>&1
  if not %errorLevel% == 0 goto usage

:main
  set service_name=xmex
  set service_account=NetworkService
  set nssm=%home%\nssm\nssm.exe

  if "%1" == "install"   goto install
  if "%1" == "update"    goto install
  if "%1" == "uninstall" goto uninstall

  if "%1" == "start"     goto start
  if "%1" == "restart"   goto restart
  if "%1" == "stop"      goto stop

:usage
  echo usage: %~nx0 [command]
  echo.
  echo    install
  echo    update
  echo    uninstall
  echo.
  echo    start
  echo    restart
  echo    stop

  net session >nul 2>&1
  if not %errorLevel% == 0 (
    echo.
    echo This script must run as Administrator.
  )
  goto exit

:install

  set label=INSTALL
  if "%1" == "update" set label=UPDATE

  set lastError=
  set lastError=%errorLevel%

  sc query %service_name% >nul 2>&1
  if "%errorLevel%" == "0" (
    echo %label%: Service is still present and will be stopped and removed
    sc stop %service_name% >nul
    sc delete %service_name% >%~n0.log 2>&1
    if not "%errorLevel%" == "%lastError%" goto error
  )

  :: Full access for the NetworkService or another user to the AppDirectory
  echo %label%: Grant all privileges for %service_account% to the AppDirectory
  for %%i in ("%home%") do echo    %%~fi
  icacls.exe "%home%" /grant %service_account%:(OI)(CI)F /T /Q >%~n0.log 2>&1
  if not "%lastError%" == "%errorLevel%" goto error

  :: Configuration from service
  echo %label%: Service will be created and configured
  "%nssm%" install %service_name% "%home%\node\node.exe"
  "%nssm%" set %service_name% DisplayName   Seanox XMEX
  "%nssm%" set %service_name% Description   XML Micro Exchange
  "%nssm%" set %service_name% AppDirectory  %home%
  "%nssm%" set %service_name% AppParameters service.js
  "%nssm%" set %service_name% AppStdout     %home%\logs\output.log
  "%nssm%" set %service_name% AppStderr     %home%\logs\error.log
  "%nssm%" set %service_name% Start         SERVICE_AUTO_START
  "%nssm%" set %service_name% ObjectName    %service_account%

  if not "%lastError%" == "%errorLevel%" goto error

  echo %label%: Successfully completed

  echo %label%: Service will be started
  net start %service_name% 2>%~n0.log
  if not "%lastError%" == "%errorLevel%" goto error

  goto exit

:uninstall
  set label=UNINSTALL
  set lastError=
  set lastError=%errorLevel%
  sc query %service_name% >nul 2>&1
  if "%errorLevel%" == "0" (
    echo %label%: Service is still present and will be stopped and removed
    sc stop %service_name% >nul
    sc delete %service_name% >%~n0.log 2>&1
    if not "%errorLevel%" == "%lastError%" goto error
  ) else echo %label%: Service has already been removed
  echo %label%: Successfully completed
  goto exit

:start
  sc query %service_name% >nul 2>&1
  if not "%errorLevel%" == "0" (
    echo ERROR: Service is not present
    goto exit
  )

  net start %service_name%
  goto exit

:stop
  sc query %service_name% >nul 2>&1
  if not "%errorLevel%" == "0" (
    echo ERROR: Service is not present
    goto exit
  )

  net stop %service_name%
  goto exit

:restart
  sc query %service_name% >nul 2>&1
  if not "%errorLevel%" == "0" (
    echo ERROR: Service is not present
    goto exit
  )

  net stop %service_name%
  net start %service_name%
  goto exit

:error
  echo.
  echo ERROR: An unexpected error occurred.
  echo ERROR: The script was canceled.

  if not exist %~n0.log goto exit

  echo.
  type %~n0.log
  goto exit

:exit
  if exist %~n0.log del %~n0.log
  exit /B 0
