const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DATABASE_URL
    , {
        dialect: 'postgres',
        logging: false
    });

async function test() {
    try {
        await sequelize.authenticate();
        console.log("connected to postgres");
    } catch (error) {
        console.log("connection to postgres failed");

    }
}
test();

module.exports = { sequelize, DataTypes };