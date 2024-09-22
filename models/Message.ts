import { CreationOptional, Model, InferAttributes, InferCreationAttributes, ForeignKey } from 'sequelize';
import { sequelize, DataTypes } from '../utils/database';

import Room, { RoomModel } from './Room';
import User, { UserModel } from './User';

export interface MessageModel extends Model<InferAttributes<MessageModel>, InferCreationAttributes<MessageModel>> {
    id: CreationOptional<number>,
    content: string,
    createdAt: CreationOptional<Date>,
    updatedAt: CreationOptional<Date>,

    userId: ForeignKey<UserModel['id']>,
    roomId: ForeignKey<RoomModel['id']>,

    User?: UserModel,
    Room?: RoomModel
}

const Message = sequelize.define<MessageModel>('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE
    },
    updatedAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: "messages"
});



export default Message;