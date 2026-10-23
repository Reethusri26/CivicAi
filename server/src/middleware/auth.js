import AppError from "../utils/AppError.js";
import { MODEL_BY_ROLE, verifyToken } from "../utils/tokens.js";

// Verifies the bearer token and loads the account from the database, so
// deactivated accounts and logged-out tokens are rejected immediately.
export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Please sign in to continue");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again");
  }

  const Model = MODEL_BY_ROLE[payload.role];
  const account = Model ? await Model.findById(payload.sub) : null;

  if (!account || !account.isActive || (account.tokenVersion || 0) !== payload.tv) {
    throw new AppError(401, "Your session has expired. Please sign in again");
  }

  req.user = {
    id: String(account._id),
    role: payload.role,
    name: account.fullName || account.name,
    department: account.department,
    account,
  };

  next();
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission to access this resource");
    }
    next();
  };
