import { requireOwner } from '../../utils/ownerSession.js';

export default defineEventHandler((event) => {
  requireOwner(event);
  return { owner: true };
});
