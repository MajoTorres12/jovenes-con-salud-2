import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Disease = sequelize.define('Disease', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  symptoms: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  riskFactors: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  externalResources: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  youtubeVideos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  validatedBy: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: 'Secretaría de Salud de Tamaulipas',
  },
  iconEmoji: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  colorHex: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '#871233',
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  contentImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'diseases',
  timestamps: true,
  underscored: true,
})

export default Disease
