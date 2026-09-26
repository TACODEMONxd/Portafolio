@echo off
chcp 65001 > nul
echo Sincronizando 'datos de tecnicas.txt' hacia 'js/data.js'...
node "%~dp0sincronizar_datos.js"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo   ¡Sincronización completada con éxito!
    echo   Abre o recarga index.html para ver los cambios.
    echo ====================================================
) else (
    echo.
    echo [ERROR] Hubo un problema al sincronizar los datos.
)
echo.
pause
