export default class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (what = "Resource") => new AppError(404, `${what} not found`);

export const forbidden = (message = "You do not have permission to perform this action") =>
  new AppError(403, message);

export const badRequest = (message, details) => new AppError(400, message, details);
