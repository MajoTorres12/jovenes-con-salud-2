import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const ContactSettings = sequelize.define('ContactSettings', {
  key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'contact_settings',
  timestamps: true,
  underscored: true,
})

export default ContactSettings
