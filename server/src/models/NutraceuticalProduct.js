import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import Disease from './Disease.js'

const NutraceuticalProduct = sequelize.define('NutraceuticalProduct', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  diseaseId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'diseases',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(250),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ingredients: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'MXN',
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  purchaseUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // Social programs linked (array of { id, name, type, isActive })
  socialPrograms: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
}, {
  tableName: 'nutraceutical_products',
  timestamps: true,
  underscored: true,
})

// Association
Disease.hasMany(NutraceuticalProduct, { foreignKey: 'diseaseId', as: 'nutraceuticalProducts', onDelete: 'SET NULL' })
NutraceuticalProduct.belongsTo(Disease, { foreignKey: 'diseaseId', as: 'disease' })

export default NutraceuticalProduct
