import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'sender_id',
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'receiver_id',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
})

// Associations
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' })
ChatMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' })

export default ChatMessage
