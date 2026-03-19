/**
 * Evaluates a condition string against input data.
 * Supports:
 * - Comparison: ==, !=, <, >, <=, >=
 * - Logical: &&, ||
 * - String: contains(field, "value"), startsWith(field, "prefix"), endsWith(field, "suffix")
 * - Default: DEFAULT
 */
export function evaluateCondition(condition, data) {
  if (condition === 'DEFAULT') return true;

  try {
    // Replace string functions with JS equivalents
    // contains(field, "value") -> data.field.includes("value")
    let processedCondition = condition.replace(/contains\((\w+),\s*["'](.+?)["']\)/g, (match, field, value) => {
      return `(data.${field} && data.${field}.toString().includes("${value}"))`;
    });

    // startsWith(field, "prefix") -> data.field.startsWith("prefix")
    processedCondition = processedCondition.replace(/startsWith\((\w+),\s*["'](.+?)["']\)/g, (match, field, value) => {
      return `(data.${field} && data.${field}.toString().startsWith("${value}"))`;
    });

    // endsWith(field, "suffix") -> data.field.endsWith("suffix")
    processedCondition = processedCondition.replace(/endsWith\((\w+),\s*["'](.+?)["']\)/g, (match, field, value) => {
      return `(data.${field} && data.${field}.toString().endsWith("${value}"))`;
    });

    // Use a safer approach: create a function where data keys are arguments
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    try {
      // We pass both individual keys and the full data object to the function
      const evaluator = new Function(...keys, 'data', `
        try {
          return ${processedCondition};
        } catch (e) {
          return false;
        }
      `);
      return !!evaluator(...values, data);
    } catch (e) {
      console.error('Syntax error in condition:', processedCondition);
      return false;
    }
  } catch (error) {
    console.error('Error evaluating condition:', condition, error);
    return false;
  }
}
