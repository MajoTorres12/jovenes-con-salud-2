import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'

const FamilyMember = sequelize.define('FamilyMember', {
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
  name: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  relationship: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  municipality: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  curp: {
    type: DataTypes.STRING(18),
    allowNull: false,
  },
}, {
  tableName: 'family_members',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(FamilyMember, { foreignKey: 'userId', as: 'familyMembers', onDelete: 'CASCADE' })
FamilyMember.belongsTo(User, { foreignKey: 'userId', as: 'user' })

export default FamilyMember
