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
  wearableConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'wearable_connected',
  },
  wearableDeviceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'wearable_device_id',
  },
  wearableDeviceName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'wearable_device_name',
  },
  wearableLastSync: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'wearable_last_sync',
  },
  wearableMetrics: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'wearable_metrics',
  },
  professionalLicense: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'professional_license',
  },
  specialty: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  appointmentDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30,
    field: 'appointment_duration',
  },
  maxDailyAppointments: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    field: 'max_daily_appointments',
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
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
