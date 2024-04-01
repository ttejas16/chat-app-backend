const { sequelize, DataTypes } = require('../utils/database');

const User = require('./User');
const Room = require('./Room');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: "Message"
});

Room.hasMany(Message, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})
Message.belongsTo(Room)

User.hasMany(Message, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Message.belongsTo(User)

module.exports = Message;