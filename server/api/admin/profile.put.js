import { createError } from 'h3';
import { requireOwner } from '../../utils/ownerSession.js';
import { checkMutation } from '../../utils/checkMutation.js';
import { validateProfile } from '../../utils/profileValidation.js';
import { readBoundedJson } from '../../utils/readBoundedJson.js';
import { saveProfile } from '../../utils/blobProfile.js';
import { addDiscoveredFavicons } from '../../utils/discoverFavicon.js';

export default defineEventHandler(async (event) => {
  checkMutation(event);
  requireOwner(event);
  const body = await readBoundedJson(event, 65536);
  if (body?.expectedVersion !== null && (typeof body?.expectedVersion !== 'string' || !/^"?[a-zA-Z0-9_-]{1,128}"?$/.test(body.expectedVersion))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid profile version' });
  }
  const problem = validateProfile(body.profile);
  if (problem) throw createError({ statusCode: 400, statusMessage: problem });
  const profile = await addDiscoveredFavicons(body.profile);
  // Discovered icon URLs could exceed field limits; drop any that fail validation.
  if (validateProfile(profile)) for (const link of profile.ls) delete link.fi;
  const saved = await saveProfile(profile, body.expectedVersion);
  return { ...saved, favicons: profile.ls.map((link) => link.fi || '') };
});
