import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS, UserRole } from '../../types';

describe('Role-Based Access Control (RBAC) Matrix', () => {
  it('grants full management rights to owner and admin', () => {
    const ownerPerms = ROLE_PERMISSIONS['owner'];
    const adminPerms = ROLE_PERMISSIONS['admin'];

    expect(ownerPerms.canManageOrg).toBe(true);
    expect(ownerPerms.canInviteMembers).toBe(true);
    expect(ownerPerms.canManageTournaments).toBe(true);
    expect(ownerPerms.canManageRounds).toBe(true);
    expect(ownerPerms.canEnterResults).toBe(true);

    expect(adminPerms.canManageOrg).toBe(true);
    expect(adminPerms.canInviteMembers).toBe(true);
    expect(adminPerms.canManageTournaments).toBe(true);
  });

  it('allows arbiters to pair rounds and enter results but not manage org', () => {
    const arbiterPerms = ROLE_PERMISSIONS['arbiter'];

    expect(arbiterPerms.canManageRounds).toBe(true);
    expect(arbiterPerms.canEnterResults).toBe(true);
    expect(arbiterPerms.canViewAuditLogs).toBe(true);
    expect(arbiterPerms.canManageOrg).toBe(false);
    expect(arbiterPerms.canInviteMembers).toBe(false);
  });

  it('restricts viewers to read-only access', () => {
    const viewerPerms = ROLE_PERMISSIONS['viewer'];

    expect(viewerPerms.canManageOrg).toBe(false);
    expect(viewerPerms.canManageTournaments).toBe(false);
    expect(viewerPerms.canManageRounds).toBe(false);
    expect(viewerPerms.canEnterResults).toBe(false);
    expect(viewerPerms.canManagePlayers).toBe(false);
  });
});
