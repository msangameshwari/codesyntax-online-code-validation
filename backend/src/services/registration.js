export function validateRegistration(input = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const rollNumber = typeof input.rollNumber === 'string' ? input.rollNumber.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const fields = {};
  if (!name) fields.name = 'Student name is required.';
  else if (name.length > 100) fields.name = 'Student name must be 100 characters or fewer.';
  if (!rollNumber) fields.rollNumber = 'Register / roll number is required.';
  else if (rollNumber.length > 32) fields.rollNumber = 'Register / roll number must be 32 characters or fewer.';
  if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Enter a valid email address.';
  if (password.length < 8) fields.password = 'Password must contain at least 8 characters.';
  if (password.length > 128) fields.password = 'Password must contain 128 characters or fewer.';
  return { values: { name, rollNumber, email, password }, fields, valid: Object.keys(fields).length === 0 };
}
