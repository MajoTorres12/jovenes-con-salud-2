import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import Disease from './Disease.js'

const DiseaseVariant = sequelize.define('DiseaseVariant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  diseaseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Disease,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(150),
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
}, {
  tableName: 'disease_variants',
  timestamps: true,
  underscored: true,
})

// Associations
Disease.hasMany(DiseaseVariant, { foreignKey: 'diseaseId', as: 'variants', onDelete: 'CASCADE' })
DiseaseVariant.belongsTo(Disease, { foreignKey: 'diseaseId', as: 'disease' })

export default DiseaseVariant
