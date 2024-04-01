const { sequelize } = require('../utils/database');

const User = require('./User');
const Room = require('./Room');

const Participant = sequelize.define('Participant', {}, { tableName: "Participant" });

Room.belongsToMany(User, {
    through: Participant,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
User.belongsToMany(Room, {
    through: Participant,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});


module.exports = Participant;