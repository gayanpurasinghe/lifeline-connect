import oracledb from 'oracledb';

interface CustomGlobal {
    oraclePool?: oracledb.Pool;
}

declare const globalThis: CustomGlobal;

export async function getOraclePool(): Promise<oracledb.Pool> {
    if (!globalThis.oraclePool) {
        globalThis.oraclePool = await oracledb.createPool({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR,
            poolMin: 1,
            poolMax: 5,
            poolIncrement: 1,
        });
    }
    return globalThis.oraclePool;
}

export async function executeOracleQuery<T = any>(
    sql: string,
    binds: oracledb.BindParameters = {},
    options: oracledb.ExecuteOptions = {}
) {
    const pool = await getOraclePool();
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute<T>(sql, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: true,
            ...options,
        });
        return result;
    } finally {
        await connection.close();
    }
}