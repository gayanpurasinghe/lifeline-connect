@echo off
REM =======================================================================
REM LifeLine Connect - Automated Dual-Database Backup Script
REM Backs up Oracle PDB Schema via Data Pump (expdp) and MongoDB via mongodump
REM =======================================================================

set BACKUP_DIR=C:\LifelineBackups\%date:~-4,4%-%date:~-7,2%-%date:~-10,2%
mkdir "%BACKUP_DIR%" 2>nul

echo ==============================================
echo 1. Exporting Oracle Schema (LIFELINE_CONNECT)...
echo ==============================================
expdp LIFELINE_CONNECT/LifeLine2026@localhost:1521/XEPDB1 schemas=LIFELINE_CONNECT directory=DATA_PUMP_DIR dumpfile=lifeline_oracle_%date:~-4,4%%date:~-7,2%%date:~-10,2%.dmp logfile=lifeline_oracle_exp.log

echo ==============================================
echo 2. Exporting MongoDB Database (lifeline_nosql)...
echo ==============================================
mongodump --db=lifeline_nosql --out="%BACKUP_DIR%\mongo_dump"

echo.
echo Backup completed successfully! Saved to: %BACKUP_DIR%
pause