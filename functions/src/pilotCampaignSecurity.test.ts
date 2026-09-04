import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BADRGO_PILOT_TOTAL_CODES,
  getEffectivePilotCampaignStatus,
  getPilotCodeDocumentId,
  normalizePilotCodes,
} from './pilotCampaignSecurity';

const validCodes = Array.from(
  { length: BADRGO_PILOT_TOTAL_CODES },
  (_, index) => `RIDE${String(index).padStart(6, '0')}`
);

describe('pilot campaign validation', () => {
  it('normalizes exactly 100 unique codes', () => {
    const normalized = normalizePilotCodes(validCodes.map((code) => ` ${code.toLowerCase()} `));
    assert.equal(normalized.length, 100);
    assert.equal(normalized[0], 'RIDE000000');
  });

  it('rejects duplicate codes', () => {
    const duplicateCodes = [...validCodes];
    duplicateCodes[99] = duplicateCodes[0];
    assert.throws(() => normalizePilotCodes(duplicateCodes), /unique/);
  });

  it('rejects an incomplete inventory', () => {
    assert.throws(() => normalizePilotCodes(validCodes.slice(0, 99)), /Exactly 100/);
  });

  it('maps campaign timing and inventory to effective states', () => {
    assert.equal(getEffectivePilotCampaignStatus({
      status: 'active',
      startsAtMs: 2_000,
      publicAssignedCount: 0,
      nowMs: 1_000,
    }), 'scheduled');
    assert.equal(getEffectivePilotCampaignStatus({
      status: 'active',
      endsAtMs: 2_000,
      publicAssignedCount: 0,
      nowMs: 2_000,
    }), 'ended');
    assert.equal(getEffectivePilotCampaignStatus({
      status: 'active',
      publicAssignedCount: 80,
      nowMs: 1_000,
    }), 'sold_out');
  });

  it('creates stable sortable code document IDs', () => {
    assert.equal(getPilotCodeDocumentId(0), '000');
    assert.equal(getPilotCodeDocumentId(99), '099');
  });
});
