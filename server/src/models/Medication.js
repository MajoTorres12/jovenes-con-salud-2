import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'
import FamilyMember from './FamilyMember.js'

const Medication = sequelize.define('Medication', {
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
  name: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  dose: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  frequency: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  schedules: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'medications',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(Medication, { foreignKey: 'userId', as: 'medications', onDelete: 'CASCADE' })
Medication.belongsTo(User, { foreignKey: 'userId', as: 'user' })

FamilyMember.hasMany(Medication, { foreignKey: 'familyMemberId', as: 'medications', onDelete: 'CASCADE' })
Medication.belongsTo(FamilyMember, { foreignKey: 'familyMemberId', as: 'familyMember' })

export default Medication
