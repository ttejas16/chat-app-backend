import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes } from 'sequelize';
import { sequelize } from '../utils/database';

import Room, { RoomModel } from './Room';
import User, { UserModel } from './User';

interface ParticipantModel extends Model<InferAttributes<ParticipantModel>, InferCreationAttributes<ParticipantModel>> {
    roomId: ForeignKey<RoomModel['id']>,
    userId: ForeignKey<UserModel['id']>,
    createdAt: CreationOptional<Date>,
    updatedAt: CreationOptional<Date>,
}

const Participant = sequelize.define<ParticipantModel>('Participant', {
    roomId: {
        type: DataTypes.UUID
    },
    userId: {
        type: DataTypes.UUID
    },
    createdAt: {
        type: DataTypes.DATE
    },
    updatedAt: {
        type: DataTypes.DATE
    }
}, { tableName: "participants" });



export default Participant;