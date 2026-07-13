import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'

const DoctorSchedule = sequelize.define('DoctorSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'doctor_id',
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 6,
    },
    field: 'day_of_week',
  },
  startTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      is: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    field: 'start_time',
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      is: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    field: 'end_time',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'doctor_schedules',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(DoctorSchedule, { foreignKey: 'doctorId', as: 'schedules', onDelete: 'CASCADE' })
DoctorSchedule.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' })

export default DoctorSchedule
