import crypto from "crypto";
import mongoose from "mongoose";
import { fileUrlSecret } from "../config/env.js";

// Evidence images are stored in MongoDB GridFS so they survive Render
// redeploys (container disk is ephemeral) without adding another provider.
// Files are never public: the API hands out short-lived signed URLs only to
// users who are authorised to see the complaint.

const BUCKET = "evidence";
const URL_TTL_SECONDS = 60 * 60;

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

export const saveImages = async (files, metadata) => {
  const refs = [];

  for (const file of files) {
    const safeName = file.originalname.replace(/[^\w.-]+/g, "_").slice(-80) || "image";
    const id = new mongoose.Types.ObjectId();

    await new Promise((resolve, reject) => {
      const stream = bucket().openUploadStreamWithId(id, safeName, {
        metadata: { ...metadata, contentType: file.mimetype },
      });
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(file.buffer);
    });

    refs.push({
      fileId: id,
      filename: safeName,
      contentType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    });
  }

  return refs;
};

export const deleteFiles = async (refs = []) => {
  await Promise.all(
    refs.map((ref) => bucket().delete(ref.fileId).catch(() => undefined))
  );
};

const signature = (fileId, expires) =>
  crypto.createHmac("sha256", fileUrlSecret()).update(`${fileId}.${expires}`).digest("base64url");

// Relative URL; the client prefixes it with the API origin.
export const signedFileUrl = (fileId) => {
  const expires = Math.floor(Date.now() / 1000) + URL_TTL_SECONDS;
  return `/api/files/${fileId}?exp=${expires}&sig=${signature(String(fileId), expires)}`;
};

export const verifyFileSignature = (fileId, expires, sig) => {
  const exp = Number(expires);
  if (!sig || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;

  const expected = Buffer.from(signature(fileId, exp));
  const given = Buffer.from(String(sig));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

export const findFile = async (fileId) => {
  const [file] = await bucket().find({ _id: new mongoose.Types.ObjectId(fileId) }).limit(1).toArray();
  return file || null;
};

export const openDownloadStream = (fileId) =>
  bucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));

export const readFileBuffer = async (fileId) => {
  const chunks = [];
  for await (const chunk of openDownloadStream(fileId)) chunks.push(chunk);
  return Buffer.concat(chunks);
};
