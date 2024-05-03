const { sequelize, DataTypes } = require('../utils/database');

const User = sequelize.define('User', {
    id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,
        defaultValue: "",
        allowNull: false
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Hello there!",
        allowNull: false,
    },
}, {
    tableName: "User"
});

module.exports = User;