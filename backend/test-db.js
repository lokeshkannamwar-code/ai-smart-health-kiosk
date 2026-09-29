const pool = require("./config/database");

async function testDatabase() {
    try {
        const result = await pool.query(`
            SELECT
                current_database() AS database_name,
                current_user AS database_user,
                NOW() AS server_time;
        `);

        console.log("✅ Database connection successful");
        console.log(result.rows[0]);
    } catch (error) {
        console.error("❌ Database connection failed");
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

testDatabase();