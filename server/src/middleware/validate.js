const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validate(schema, data) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null || value === "") continue;

    if (rules.type === "uuid" && !UUID_RE.test(value)) {
      errors.push(`${field} must be a valid UUID`);
    }

    if (rules.type === "number") {
      const n = Number(value);
      if (isNaN(n) || !isFinite(n)) {
        errors.push(`${field} must be a valid number`);
      }
    }

    if (rules.type === "date" && !DATE_RE.test(value)) {
      errors.push(`${field} must be a valid date (YYYY-MM-DD)`);
    }

    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(
        `${field} must be one of: ${rules.enum.join(", ")}`
      );
    }

    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${field} must be at most ${rules.maxLength} characters`);
    }
  }

  return errors.length ? errors : null;
}
