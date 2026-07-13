import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'patient_id',
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
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'appointment_date',
  },
  appointmentTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      is: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    field: 'appointment_time',
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason',
  },
  meetLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'meet_link',
  },
  meetCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'meet_code',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(Appointment, { foreignKey: 'patientId', as: 'patientAppointments', onDelete: 'CASCADE' })
User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments', onDelete: 'CASCADE' })
Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' })
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' })

export default Appointment
