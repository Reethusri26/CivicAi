import { badRequest } from "../utils/AppError.js";

const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

// Parses req[source] with a zod schema and replaces it with the parsed value.
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const details = formatIssues(result.error);
      throw badRequest(details[0]?.message || "Invalid input", details);
    }

    if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
