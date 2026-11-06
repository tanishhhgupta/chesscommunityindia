import { describe, it, expect } from 'vitest';
import { parsePlayerCsv, generateSampleCsv, generateSampleTrf, generateSampleJson, exportPlayersToCsv } from '../csv';
import { Player } from '../../types';

describe('Player CSV Import and Export', () => {
  it('generates sample CSV with valid headers and parses successfully', () => {
    const sample = generateSampleCsv();
    expect(sample).toContain('Name,Rating,Title,FIDE ID,Federation,Club,Email');
    expect(sample).toContain('Hikaru Nakamura');
    const parsed = parsePlayerCsv(sample);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.validPlayers.length).toBeGreaterThanOrEqual(4);
  });

  it('generates valid sample TRF', () => {
    const trf = generateSampleTrf();
    expect(trf).toContain('001 ');
    expect(trf).toContain('Carlsen, Magnus');
    expect(trf).toContain('1503014');
  });

  it('generates valid sample JSON that parses to player array', () => {
    const jsonStr = generateSampleJson();
    const parsed = JSON.parse(jsonStr);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(3);
    expect(parsed[0].name).toBe('Magnus Carlsen');
  });

  it('parses valid CSV text correctly', () => {
    const csv = `Name,Rating,Title,FIDE ID,Federation,Club,Email
"Carlsen, Magnus",2830,GM,1503014,NOR,Offerspill,magnus@test.com
Nakamura Hikaru,2800,GM,2016192,USA,Blitz Club,hikaru@test.com
Amateur Player,1450,None,,USA,Local Club,amateur@test.com`;

    const result = parsePlayerCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.validPlayers).toHaveLength(3);

    expect(result.validPlayers[0].name).toBe('Carlsen, Magnus');
    expect(result.validPlayers[0].rating).toBe(2830);
    expect(result.validPlayers[0].title).toBe('GM');
    expect(result.validPlayers[0].fideId).toBe('1503014');
    expect(result.validPlayers[0].federation).toBe('NOR');

    expect(result.validPlayers[2].title).toBe('None');
    expect(result.validPlayers[2].rating).toBe(1450);
  });

  it('handles invalid lines and reports descriptive row errors', () => {
    const badCsv = `Name,Rating,Title
,1800,GM
Valid Player,invalid_rating,None`;

    const result = parsePlayerCsv(badCsv);
    // Row 2 is missing name
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0].row).toBe(2);
    // Row 3 should default rating to 1200
    expect(result.validPlayers).toHaveLength(1);
    expect(result.validPlayers[0].name).toBe('Valid Player');
    expect(result.validPlayers[0].rating).toBe(1200);
  });

  it('exports players back to valid CSV format', () => {
    const players: Player[] = [
      {
        id: '1',
        organizationId: 'org-1',
        name: 'Fabiano Caruana',
        rating: 2805,
        title: 'GM',
        federation: 'USA',
        club: 'Saint Louis Chess Club',
        email: 'fabi@test.com',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const exported = exportPlayersToCsv(players);
    expect(exported).toContain('Fabiano Caruana');
    expect(exported).toContain('2805');
    expect(exported).toContain('GM');
    expect(exported).toContain('Saint Louis Chess Club');
  });

  it('parses semicolon-delimited CSVs correctly', () => {
    const semiCsv = `Name;Rating;Title;FIDE ID;Federation
Ding Liren;2780;GM;8603677;CHN
Gukesh D;2794;GM;46616543;IND`;

    const result = parsePlayerCsv(semiCsv);
    expect(result.errors).toHaveLength(0);
    expect(result.validPlayers).toHaveLength(2);
    expect(result.validPlayers[0].name).toBe('Ding Liren');
    expect(result.validPlayers[0].rating).toBe(2780);
    expect(result.validPlayers[1].name).toBe('Gukesh D');
  });

  it('handles separate Surname and First Name columns', () => {
    const splitNameCsv = `Surname,First Name,Rating,Title
Anand,Viswanathan,2750,GM
Kasparov,Garry,2812,GM`;

    const result = parsePlayerCsv(splitNameCsv);
    expect(result.errors).toHaveLength(0);
    expect(result.validPlayers).toHaveLength(2);
    expect(result.validPlayers[0].name).toBe('Anand, Viswanathan');
    expect(result.validPlayers[0].rating).toBe(2750);
  });
});
