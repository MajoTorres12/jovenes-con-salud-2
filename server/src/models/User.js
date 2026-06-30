import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'doctor'),
    defaultValue: 'user',
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'doctor_id',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  deviceToken: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'device_token',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
})

// Associations
User.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' })
User.hasMany(User, { foreignKey: 'doctorId', as: 'patients' })

export default User
