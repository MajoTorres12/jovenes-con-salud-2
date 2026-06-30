import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import User from './User.js'
import FamilyMember from './FamilyMember.js'

const Supplement = sequelize.define('Supplement', {
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
  tableName: 'supplements',
  timestamps: true,
  underscored: true,
})

// Associations
User.hasMany(Supplement, { foreignKey: 'userId', as: 'supplements', onDelete: 'CASCADE' })
Supplement.belongsTo(User, { foreignKey: 'userId', as: 'user' })

FamilyMember.hasMany(Supplement, { foreignKey: 'familyMemberId', as: 'supplements', onDelete: 'CASCADE' })
Supplement.belongsTo(FamilyMember, { foreignKey: 'familyMemberId', as: 'familyMember' })

export default Supplement
