import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'
import FamilyMember from './FamilyMember.js'

const HealthRecord = sequelize.define('HealthRecord', {
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
  },
  familyMemberId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'family_members',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides'),
    allowNull: false,
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  value2: {
    // For blood pressure diastolic value (value = systolic, value2 = diastolic)
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'health_records',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(HealthRecord, { foreignKey: 'userId', as: 'healthRecords' })
HealthRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' })

FamilyMember.hasMany(HealthRecord, { foreignKey: 'familyMemberId', as: 'healthRecords', onDelete: 'CASCADE' })
HealthRecord.belongsTo(FamilyMember, { foreignKey: 'familyMemberId', as: 'familyMember' })

export default HealthRecord
