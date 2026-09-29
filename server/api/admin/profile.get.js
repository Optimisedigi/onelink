import { requireOwner } from '../../utils/ownerSession.js';
import { readProfile } from '../../utils/blobProfile.js';

export default defineEventHandler(async (event) => {
  requireOwner(event);
  return await readProfile();
});
