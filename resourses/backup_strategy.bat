@echo off
REM ============================================================================
REM  LifeLine Connect - Enterprise Dual-Database Backup Automation Script
REM  Target Databases:
REM    1. Oracle 21c Express Edition (PDB: XEPDB1 | Schema: LIFELINE_CONNECT)
REM    2. MongoDB NoSQL Database (DB: lifeline_nosql)
REM ============================================================================

setlocal enabledelayedexpansion

echo ============================================================================
echo   LifeLine Connect - Database Disaster Recovery & Backup Routine
echo ============================================================================

:: Generate timestamp formatted as YYYYMMDD_HHMMSS
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set TIMESTAMP=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%

set BACKUP_ROOT=%~dp0backups
set BACKUP_DIR=%BACKUP_ROOT%\backup_%TIMESTAMP%

echo [*] Target Backup Folder: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" 2>nul
mkdir "%BACKUP_DIR%\oracle" 2>nul
mkdir "%BACKUP_DIR%\mongodb" 2>nul

:: -----------------------------------------------------------------------------
:: PART 1: Oracle 21c Database Backup via Data Pump Export (expdp)
:: -----------------------------------------------------------------------------
echo.
echo [1/2] Executing Oracle 21c Data Pump Export (expdp)...
echo       Connecting to PDB: XEPDB1 as schema: LIFELINE_CONNECT

set ORACLE_CONN=LIFELINE_CONNECT/LifeLine2026@//localhost:1521/XEPDB1
set ORACLE_DUMP=lifeline_backup_%TIMESTAMP%.dmp
set ORACLE_LOG=lifeline_backup_%TIMESTAMP%.log

expdp %ORACLE_CONN% schemas=LIFELINE_CONNECT directory=DATA_PUMP_DIR dumpfile=%ORACLE_DUMP% logfile=%ORACLE_LOG% reuse_dumpfiles=YES

if %ERRORLEVEL% equ 0 (
    echo [OK] Oracle 21c Schema Export Successful.
    echo      Dumpfile: %ORACLE_DUMP% (located in DATA_PUMP_DIR)
) else (
    echo [WARNING] Oracle expdp returned code %ERRORLEVEL%. 
    echo           Please ensure Oracle XE and TNS listener are running and DATA_PUMP_DIR is configured.
)

:: -----------------------------------------------------------------------------
:: PART 2: MongoDB NoSQL Backup via mongodump
:: -----------------------------------------------------------------------------
echo.
echo [2/2] Executing MongoDB NoSQL Dump (mongodump)...
echo       Target Database: lifeline_nosql

mongodump --host localhost --port 27017 --db lifeline_nosql --out "%BACKUP_DIR%\mongodb"

if %ERRORLEVEL% equ 0 (
    echo [OK] MongoDB Collections Exported Successfully to %BACKUP_DIR%\mongodb\lifeline_nosql.
) else (
    echo [WARNING] mongodump returned code %ERRORLEVEL%.
    echo           Please ensure MongoDB service is active on port 27017.
)

:: -----------------------------------------------------------------------------
:: PART 3: In-App Full Snapshot API Trigger (Zero-Dependency Fallback)
:: -----------------------------------------------------------------------------
echo.
echo [*] Triggering In-App Backup API Endpoint Snapshot as well...
curl -s -X POST http://localhost:3000/api/backup -H "Content-Type: application/json" > "%BACKUP_DIR%\api_backup_report.json" 2>nul
if not exist "%BACKUP_DIR%\api_backup_report.json" (
    curl -s -X POST http://localhost:3001/api/backup -H "Content-Type: application/json" > "%BACKUP_DIR%\api_backup_report.json" 2>nul
)

:: Create Backup Manifest
(
    echo LifeLine Connect Backup Manifest
    echo Timestamp: %TIMESTAMP%
    echo Oracle PDB: XEPDB1
    echo Oracle Schema: LIFELINE_CONNECT
    echo Oracle Dump File: %ORACLE_DUMP%
    echo MongoDB DB: lifeline_nosql
    echo Backup Directory: %BACKUP_DIR%
) > "%BACKUP_DIR%\manifest.txt"

echo.
echo ============================================================================
echo   Backup Routine Finished at %TIME%
echo   Manifest saved: %BACKUP_DIR%\manifest.txt
echo ============================================================================
pause
