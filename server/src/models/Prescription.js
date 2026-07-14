import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'
import Appointment from './Appointment.js'

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Appointment,
      key: 'id',
    },
    field: 'appointment_id',
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
  folio: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  medications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  generalInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'general_instructions',
  },
  doctorName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'doctor_name',
  },
  doctorLicense: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'doctor_license',
  },
  doctorSpecialty: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'doctor_specialty',
  },
  doctorSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'doctor_signature',
  },
  issuedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'issued_at',
  },
  validUntil: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'valid_until',
  },
}, {
  tableName: 'prescriptions',
  timestamps: true,
  underscored: true,
})

// Associations
Appointment.hasOne(Prescription, { foreignKey: 'appointmentId', onDelete: 'SET NULL' })
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId' })

User.hasMany(Prescription, { foreignKey: 'patientId', as: 'patientPrescriptions', onDelete: 'CASCADE' })
Prescription.belongsTo(User, { foreignKey: 'patientId', as: 'patient' })

User.hasMany(Prescription, { foreignKey: 'doctorId', as: 'doctorPrescriptions', onDelete: 'CASCADE' })
Prescription.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' })

export default Prescription
