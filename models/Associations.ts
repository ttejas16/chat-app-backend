import { sequelize } from "../utils/database";

import User from "./User";
import Room from "./Room";
import Message from "./Message";
import Participant from "./Participant";

function createAssociations() {
    // user <--> room
    Room.belongsToMany(User, {
        through: Participant,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        foreignKey: 'roomId',
    });
    User.belongsToMany(Room, {
        through: Participant,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        foreignKey: 'userId',
    });

    Room.hasMany(Message, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        foreignKey: 'roomId'
    })
    Message.belongsTo(Room, { targetKey: 'id', foreignKey: 'roomId' })

    User.hasMany(Message, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        foreignKey: 'userId'
    });
    Message.belongsTo(User, { targetKey: 'id', foreignKey: 'userId' })
}


export default createAssociations;


