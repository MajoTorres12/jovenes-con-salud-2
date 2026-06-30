import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Article = sequelize.define('Article', {
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
  title: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(250),
    allowNull: false,
    unique: true,
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: 'general',
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'articles',
  timestamps: true,
  underscored: true,
})

import Disease from './Disease.js'
Disease.hasMany(Article, { foreignKey: 'diseaseId', as: 'articles', onDelete: 'SET NULL' })
Article.belongsTo(Disease, { foreignKey: 'diseaseId', as: 'disease' })

export default Article
