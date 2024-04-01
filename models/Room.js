const { sequelize, DataTypes } = require('../utils/database');

const Room = sequelize.define('Room', {
    id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    roomName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isGroup: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    tableName: "Room"
});

module.exports = Room;