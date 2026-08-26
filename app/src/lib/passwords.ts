// Shared so the signup form's minLength and the server-side check in
// /api/signup can't drift apart — the form is a convenience, the route is
// the actual enforcement point.
export const MIN_PASSWORD_LENGTH = 8;
