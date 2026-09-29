import { checkMutation } from '../../utils/checkMutation.js';
import { revokeOwnerSession } from '../../utils/ownerSession.js';

export default defineEventHandler((event) => {
  checkMutation(event);
  revokeOwnerSession(event);
  return { ok: true };
});
