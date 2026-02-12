const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const { Readable } = require('stream');

const BUCKET_NAME = process.env.GRIDFS_BUCKET_NAME || 'docx';

function _getDb() {
  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1 || !conn.db) {
    throw new Error('MongoDB is not connected yet (GridFS unavailable)');
  }
  return conn.db;
}

function getDocxBucket() {
  return new GridFSBucket(_getDb(), { bucketName: BUCKET_NAME });
}

async function deleteDocxById(fileId) {
  if (!fileId) return;
  const bucket = getDocxBucket();
  const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  try {
    await bucket.delete(id);
  } catch (err) {
    // ignore "file not found" (happens if it was already deleted)
    if (!String(err?.message || '').toLowerCase().includes('file not found')) {
      throw err;
    }
  }
}

async function markDocxExpireAt(fileId, expireAt) {
  if (!fileId || !expireAt) return;
  const db = _getDb();
  const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  const filesColl = db.collection(`${BUCKET_NAME}.files`);
  await filesColl.updateOne(
    { _id: id },
    { $set: { 'metadata.expireAt': expireAt } }
  );
}

async function uploadDocxBuffer({ filename, buffer, metadata }) {
  const bucket = getDocxBucket();
  return await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      metadata: { createdAt: new Date(), ...(metadata || {}) },
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id));

    Readable.from(buffer).pipe(uploadStream);
  });
}

function streamDocxByFilename(res, filename) {
  const bucket = getDocxBucket();
  const downloadStream = bucket.openDownloadStreamByName(filename);

  downloadStream.on('file', (file) => {
    res.setHeader('Content-Type', file.contentType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  });

  downloadStream.on('error', (err) => {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('file not found')) {
      res.status(404).send('DOCX not found');
      return;
    }
    res.status(500).send('DOCX download failed');
  });

  downloadStream.pipe(res);
}

module.exports = {
  getDocxBucket,
  deleteDocxById,
  markDocxExpireAt,
  uploadDocxBuffer,
  streamDocxByFilename,
};
