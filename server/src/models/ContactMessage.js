import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'read', 'replied'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'contact_messages',
  timestamps: true,
  underscored: true,
})

export default ContactMessage
