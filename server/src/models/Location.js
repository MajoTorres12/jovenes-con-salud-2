import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  label: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  isOfficial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'locations',
  timestamps: true,
  underscored: true,
})

export default Location
