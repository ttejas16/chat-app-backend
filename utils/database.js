const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
});

async function test() {
    try {
        await sequelize.authenticate();
        console.log("successs");
    } catch (error) {
        console.log("lol no bro");

    }

}
// test();
module.exports = { sequelize, DataTypes };