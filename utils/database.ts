import process from "process";
import { Sequelize, DataTypes } from "sequelize";


const sequelize = new Sequelize(
    process.env.DATABASE_URL!
    , {
        dialect: 'postgres',
        logging: false
    });

async function test() {
    try {
        await sequelize.authenticate();
        console.log("connected to postgres");
    } catch (err) {
        console.log(err)
        console.log("connection to postgres failed");

    }
}
test();

export { sequelize, DataTypes };