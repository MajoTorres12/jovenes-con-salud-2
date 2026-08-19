import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import AppRelease from '../models/AppRelease.js'

const router = Router()

// GET /api/app/latest-apk
// Public endpoint to get latest APK metadata
router.get('/latest-apk', async (_req, res, next) => {
  try {
    const release = await AppRelease.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    })

    if (!release) {
      return res.json({
        available: false,
        message: 'No hay ninguna versión de la aplicación disponible actualmente.',
      })
    }

    // Verify file exists on server
    const fullPath = path.resolve(release.filePath)
    const exists = fs.existsSync(fullPath)

    res.json({
      available: exists,
      id: release.id,
      version: release.version,
      fileName: release.fileName,
      fileSize: Number(release.fileSize),
      releaseNotes: release.releaseNotes,
      downloadCount: release.downloadCount,
      updatedAt: release.updatedAt,
      downloadUrl: '/api/app/download-apk',
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/app/download-apk
// Public endpoint to download the active APK file
router.get('/download-apk', async (req, res, next) => {
  try {
    const release = await AppRelease.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    })

    if (!release) {
      return res.status(404).json({
        error: 'No hay archivo APK disponible para descargar.',
      })
    }

    const fullPath = path.resolve(release.filePath)
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'El archivo APK físico no se encuentra en el servidor.',
      })
    }

    // Increment download counter
    try {
      await release.increment('downloadCount')
    } catch (countErr) {
      console.warn('Could not increment download count:', countErr.message)
    }

    const downloadFileName = release.fileName || `jovenes-con-salud-v${release.version}.apk`

    // Set headers and send file
    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.download(fullPath, downloadFileName, (err) => {
      if (err && !res.headersSent) {
        next(err)
      }
    })
  } catch (err) {
    next(err)
  }
})

export default router
