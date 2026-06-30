import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const NewsPost = sequelize.define('NewsPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  author: {
    type: DataTypes.STRING(250),
    allowNull: true,
    defaultValue: 'Instituto de la Juventud de Tamaulipas',
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  tableName: 'news_posts',
  timestamps: true,
  underscored: true,
})

export default NewsPost
