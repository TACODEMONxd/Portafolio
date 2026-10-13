@echo off
chcp 65001 > nul
echo Compilando Tailwind CSS (clases usadas en index.html y js/)...
call npx tailwindcss -i src/tailwind-input.css -o css/tailwind.min.css --minify
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo   Compilacion completada: css/tailwind.min.css
    echo   Vuelve a cargar index.html para ver los cambios.
    echo.
    echo   Ejecuta este .bat cada vez que agregues clases
    echo   nuevas de Tailwind en el HTML o en js/.
    echo ====================================================
) else (
    echo.
    echo [ERROR] Hubo un problema al compilar Tailwind.
    echo        Verifica que Node.js este instalado.
)
echo.
pause
