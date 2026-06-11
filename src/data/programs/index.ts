import { MASTERCARD_PARTNER, MASTERCARD_PROGRAMS } from './mastercard';
import type { PartnerProgram, ProgramPartner } from '@/types/program';

export const PROGRAM_PARTNERS: ProgramPartner[] = [MASTERCARD_PARTNER];

export const PARTNER_PROGRAMS: PartnerProgram[] = [...MASTERCARD_PROGRAMS].sort(
  (a, b) => a.sortOrder - b.sortOrder
);

export function getActivePrograms(): PartnerProgram[] {
  return PARTNER_PROGRAMS.filter((program) => program.isActive);
}

export function getProgramById(programId: string): PartnerProgram | undefined {
  return PARTNER_PROGRAMS.find((program) => program.id === programId);
}

export function getProgramsByPartner(partnerId: string): PartnerProgram[] {
  return PARTNER_PROGRAMS.filter((program) => program.partnerId === partnerId && program.isActive);
}

export function getPartnerById(partnerId: string): ProgramPartner | undefined {
  return PROGRAM_PARTNERS.find((partner) => partner.id === partnerId);
}

export function getPrimaryProgramPartner(): ProgramPartner | undefined {
  return PROGRAM_PARTNERS.find((partner) => partner.isActive);
}

export { MASTERCARD_PARTNER, MASTERCARD_PROGRAMS };

