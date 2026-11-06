export * from './types';
export * from './SwissEngine';
export * from './RoundRobinEngine';
export * from './KnockoutEngine';
export * from './TeamEngine';
export * from './FideSwissEnginePlaceholder';

import { BasicSwissEngine } from './SwissEngine';
import { RoundRobinEngine } from './RoundRobinEngine';
import { KnockoutEngine } from './KnockoutEngine';
import { TeamEngine } from './TeamEngine';
import { FideSwissEnginePlaceholder } from './FideSwissEnginePlaceholder';
import { TournamentEngine } from './types';

export type TournamentFormat = 'basic_swiss' | 'round_robin' | 'knockout' | 'team' | 'fide_swiss';

/**
 * Factory function to retrieve the appropriate engine for any tournament format
 */
export function getTournamentEngine(format: TournamentFormat): TournamentEngine {
  switch (format) {
    case 'basic_swiss':
      return new BasicSwissEngine();
    case 'round_robin':
      return new RoundRobinEngine();
    case 'knockout':
      return new KnockoutEngine();
    case 'team':
      return new TeamEngine();
    case 'fide_swiss':
      return new FideSwissEnginePlaceholder();
    default:
      return new BasicSwissEngine();
  }
}
