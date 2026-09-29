import { setHeader } from 'h3';
import { readProfile } from '../utils/blobProfile.js';

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store');
  const { profile } = await readProfile();
  return { profile };
});
