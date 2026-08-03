import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'

const MedicalHistory = sequelize.define('MedicalHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'user_id',
  },
  curp: {
    type: DataTypes.STRING(18),
    allowNull: true,
  },
  nss: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bloodType: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'blood_type',
  },
  organDonor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'organ_donor',
  },
  allergies: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  hereditaryDiseases: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    field: 'hereditary_diseases',
  },
  personalPathologies: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    field: 'personal_pathologies',
  },
  emergencyContactName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'emergency_contact_name',
  },
  emergencyContactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'emergency_contact_phone',
  },
  emergencyContactRelation: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'emergency_contact_relation',
  },
  diagnoses: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  labReports: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    field: 'lab_reports',
  },
}, {
  tableName: 'medical_histories',
  timestamps: true,
  underscored: true,
})

MedicalHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasOne(MedicalHistory, { foreignKey: 'userId', as: 'medicalHistory' })

export default MedicalHistory
