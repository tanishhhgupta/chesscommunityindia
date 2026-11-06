import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Organization, OrganizationMember, ROLE_PERMISSIONS, UserRole } from '../types';
import { db } from '../lib/storage';
import { useAuth } from './AuthContext';

interface OrgContextType {
  organizations: Organization[];
  activeOrg: Organization;
  setActiveOrgId: (id: string) => void;
  createOrganization: (data: { name: string; slug: string; description?: string; country?: string }) => Organization;
  members: OrganizationMember[];
  userRole: UserRole;
  permissions: (typeof ROLE_PERMISSIONS)[UserRole];
  inviteMember: (email: string, role: UserRole) => void;
  updateMemberRole: (memberId: string, role: UserRole) => void;
  removeMember: (memberId: string) => void;
  refreshOrgData: () => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>(() => db.getOrganizations());
  const [activeOrgId, setActiveOrgIdState] = useState<string>(() => db.getActiveOrgId());
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  const refreshOrgData = useCallback(() => {
    const orgs = db.getOrganizations();
    setOrganizations(orgs);
    const active = orgs.find((o) => o.id === activeOrgId) || orgs[0];
    if (active) {
      setMembers(db.getMembers(active.id));
    }
  }, [activeOrgId]);

  useEffect(() => {
    refreshOrgData();
  }, [activeOrgId, refreshOrgData]);

  const activeOrg = useMemo(() => {
    return organizations.find((o) => o.id === activeOrgId) || organizations[0];
  }, [organizations, activeOrgId]);

  const setActiveOrgId = (id: string) => {
    db.setActiveOrgId(id);
    setActiveOrgIdState(id);
  };

  const userRole: UserRole = useMemo(() => {
    if (!activeOrg) return 'viewer';
    const member = members.find((m) => m.userId === currentUser.id);
    return member ? member.role : 'viewer';
  }, [activeOrg, members, currentUser]);

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[userRole];
  }, [userRole]);

  const createOrganization = (data: {
    name: string;
    slug: string;
    description?: string;
    country?: string;
  }) => {
    const newOrg = db.createOrganization({
      name: data.name,
      slug: data.slug,
      description: data.description,
      country: data.country || 'USA',
      createdBy: currentUser.id,
    });
    setOrganizations(db.getOrganizations());
    setActiveOrgId(newOrg.id);
    return newOrg;
  };

  const inviteMember = (email: string, role: UserRole) => {
    const profiles = db.getProfiles();
    let targetProfile = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (!targetProfile) {
      // Create guest profile
      targetProfile = {
        id: `user-${Date.now()}`,
        email,
        fullName: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      profiles.push(targetProfile);
      localStorage.setItem('chesspair_profiles_v1', JSON.stringify(profiles));
    }

    db.addMember({
      organizationId: activeOrg.id,
      userId: targetProfile.id,
      role,
      user: targetProfile,
    });

    db.addAuditLog({
      organizationId: activeOrg.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'UPDATE_SETTINGS',
      details: { invitedEmail: email, assignedRole: role },
    });

    refreshOrgData();
  };

  const updateMemberRole = (memberId: string, role: UserRole) => {
    db.updateMemberRole(memberId, role);
    db.addAuditLog({
      organizationId: activeOrg.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'UPDATE_SETTINGS',
      details: { updatedMemberId: memberId, newRole: role },
    });
    refreshOrgData();
  };

  const removeMember = (memberId: string) => {
    db.removeMember(memberId);
    db.addAuditLog({
      organizationId: activeOrg.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      action: 'UPDATE_SETTINGS',
      details: { removedMemberId: memberId },
    });
    refreshOrgData();
  };

  return (
    <OrgContext.Provider
      value={{
        organizations,
        activeOrg,
        setActiveOrgId,
        createOrganization,
        members,
        userRole,
        permissions,
        inviteMember,
        updateMemberRole,
        removeMember,
        refreshOrgData,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = (): OrgContextType => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
