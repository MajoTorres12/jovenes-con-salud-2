import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'
import HealthRecord from './HealthRecord.js'

const MedicalAlert = sequelize.define('MedicalAlert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'user_id',
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
  healthRecordId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: HealthRecord,
      key: 'id',
    },
    field: 'health_record_id',
  },
  severity: {
    type: DataTypes.ENUM('warning', 'critical'),
    defaultValue: 'warning',
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'dismissed'),
    defaultValue: 'pending',
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'recorded_at',
  },
}, {
  tableName: 'medical_alerts',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(MedicalAlert, { foreignKey: 'userId', as: 'medicalAlerts', onDelete: 'CASCADE' })
MedicalAlert.belongsTo(User, { foreignKey: 'userId', as: 'patient' })

User.hasMany(MedicalAlert, { foreignKey: 'doctorId', as: 'doctorAlerts', onDelete: 'CASCADE' })
MedicalAlert.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' })

HealthRecord.hasMany(MedicalAlert, { foreignKey: 'healthRecordId', as: 'medicalAlerts', onDelete: 'CASCADE' })
MedicalAlert.belongsTo(HealthRecord, { foreignKey: 'healthRecordId', as: 'healthRecord' })

export default MedicalAlert
