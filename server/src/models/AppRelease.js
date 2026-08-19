import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const AppRelease = sequelize.define('AppRelease', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '1.0.0',
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    defaultValue: 'application/vnd.android.package-archive',
  },
  releaseNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'app_releases',
  timestamps: true,
  underscored: true,
})

export default AppRelease
