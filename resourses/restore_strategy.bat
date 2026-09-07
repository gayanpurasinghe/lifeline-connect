@echo off
REM ============================================================================
REM  LifeLine Connect - Enterprise Dual-Database Disaster Recovery / Restore Script
REM  Target Databases:
REM    1. Oracle 21c Express Edition (PDB: XEPDB1 | Schema: LIFELINE_CONNECT)
REM    2. MongoDB NoSQL Database (DB: lifeline_nosql)
REM ============================================================================

setlocal enabledelayedexpansion

echo ============================================================================
echo   LifeLine Connect - Database Restore & Disaster Recovery Routine
echo ============================================================================
echo.
echo CAUTION: This operation restores the databases from backup snapshots.
echo Existing records may be overwritten or merged.
echo.

set /p DUMP_NAME="Enter Oracle Dumpfile Name (e.g., lifeline_backup_20260907_010000.dmp): "
if "%DUMP_NAME%"=="" (
    echo [ERROR] Dump file name cannot be empty. Aborting.
    pause
    exit /b 1
)

set /p MONGO_FOLDER="Enter MongoDB Dump Folder Path (e.g., resourses\backups\backup_...): "

:: -----------------------------------------------------------------------------
:: PART 1: Oracle 21c Database Restore via Data Pump Import (impdp)
:: -----------------------------------------------------------------------------
echo.
echo [1/2] Executing Oracle 21c Data Pump Import (impdp)...
echo       Connecting to PDB: XEPDB1 as schema: LIFELINE_CONNECT

set ORACLE_CONN=LIFELINE_CONNECT/LifeLine2026@//localhost:1521/XEPDB1

impdp %ORACLE_CONN% schemas=LIFELINE_CONNECT directory=DATA_PUMP_DIR dumpfile=%DUMP_NAME% logfile=restore_%DUMP_NAME%.log table_exists_action=REPLACE

if %ERRORLEVEL% equ 0 (
    echo [OK] Oracle 21c Schema Restore Completed Successfully.
) else (
    echo [WARNING] Oracle impdp returned code %ERRORLEVEL%. Please review restore log in DATA_PUMP_DIR.
)

:: -----------------------------------------------------------------------------
:: PART 2: MongoDB NoSQL Restore via mongorestore
:: -----------------------------------------------------------------------------
echo.
if exist "%MONGO_FOLDER%" (
    echo [2/2] Restoring MongoDB Collections from %MONGO_FOLDER%...
    mongorestore --host localhost --port 27017 --db lifeline_nosql --drop "%MONGO_FOLDER%\mongodb\lifeline_nosql"
    if %ERRORLEVEL% equ 0 (
        echo [OK] MongoDB Collections Restored Successfully.
    ) else (
        echo [WARNING] mongorestore returned code %ERRORLEVEL%.
    )
) else (
    echo [INFO] Skipped MongoDB restore: Path '%MONGO_FOLDER%' not found.
)

echo.
echo ============================================================================
echo   Disaster Recovery Routine Completed.
echo ============================================================================
pause
