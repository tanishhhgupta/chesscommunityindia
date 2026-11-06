import { ChessTitle, Player } from '../types';

export interface CsvParseResult {
  validPlayers: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[];
  errors: { row: number; error: string; raw: string }[];
  totalRows: number;
}

const VALID_TITLES: ChessTitle[] = ['GM', 'IM', 'WGM', 'FM', 'WIM', 'CM', 'WCM', 'None'];

export function parsePlayerCsv(csvText: string): CsvParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { validPlayers: [], errors: [{ row: 0, error: 'CSV file is empty', raw: '' }], totalRows: 0 };
  }

  // Detect delimiter: comma, semicolon, tab
  const headerLine = lines[0];
  let delimiter = ',';
  if (headerLine.includes(';') && (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if (headerLine.includes('\t')) {
    delimiter = '\t';
  }

  const splitLine = (line: string, delim: string): string[] => {
    if (delim === ',') {
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
    }
    if (delim === ';') {
      return line.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
    }
    return line.split('\t').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
  };

  const headers = splitLine(headerLine, delimiter).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

  const firstNameIdx = headers.findIndex((h) => h.includes('first') || h.includes('given') || h === 'fname' || h === 'vorname');
  const lastNameIdx = headers.findIndex((h) => h.includes('last') || h.includes('surname') || h.includes('family') || h === 'nachname');
  const hasSeparateFirstLast = lastNameIdx !== -1 && firstNameIdx !== -1;

  let nameIdx = -1;
  if (!hasSeparateFirstLast) {
    nameIdx = headers.findIndex((h) =>
      h === 'name' || h === 'player' || h.includes('player') || h.includes('full name') || h.includes('nom') || h.includes('spieler') || h.includes('nombre') || (h.includes('name') && !h.includes('first') && !h.includes('last'))
    );
    if (nameIdx === -1 && lastNameIdx !== -1) {
      nameIdx = lastNameIdx;
    }
  }

  const ratingIdx = headers.findIndex((h) =>
    h.includes('rating') || h.includes('elo') || h.includes('rtg') || h === 'pts' || h === 'score'
  );
  const fideIdx = headers.findIndex((h) =>
    h.includes('fide') || h.includes('fide_id') || h.includes('fideid') || h === 'id'
  );
  const titleIdx = headers.findIndex((h) => h.includes('title') || h === 'tit');
  const fedIdx = headers.findIndex((h) =>
    h.includes('fed') || h.includes('country') || h.includes('nat') || h.includes('nation')
  );
  const clubIdx = headers.findIndex((h) => h.includes('club') || h.includes('team') || h.includes('verein'));
  const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('tel') || h.includes('mobile'));
  const birthdateIdx = headers.findIndex((h) => h.includes('birth') || h.includes('dob') || h.includes('born'));

  if (nameIdx === -1 && !hasSeparateFirstLast) {
    return {
      validPlayers: [],
      errors: [{ row: 1, error: 'Could not find a "Name", "Player", or "Surname" column header', raw: headerLine }],
      totalRows: lines.length - 1,
    };
  }

  const validPlayers: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: { row: number; error: string; raw: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = splitLine(rawLine, delimiter);

    let name = '';
    if (hasSeparateFirstLast) {
      const last = cells[lastNameIdx] || '';
      const first = firstNameIdx !== -1 ? cells[firstNameIdx] || '' : '';
      name = first ? `${last}, ${first}`.trim() : last.trim();
    } else if (nameIdx !== -1 && cells[nameIdx]) {
      name = cells[nameIdx].trim();
    }

    if (!name || name === '') {
      errors.push({ row: i + 1, error: 'Player name is missing', raw: rawLine });
      continue;
    }

    // Rating
    let rating = 1200;
    if (ratingIdx !== -1 && cells[ratingIdx]) {
      const parsedRating = parseInt(cells[ratingIdx].trim(), 10);
      if (!isNaN(parsedRating) && parsedRating > 0 && parsedRating < 3500) {
        rating = parsedRating;
      }
    }

    // Title
    let title: ChessTitle = 'None';
    if (titleIdx !== -1 && cells[titleIdx]) {
      const rawTitle = cells[titleIdx].trim().toUpperCase();
      if (VALID_TITLES.includes(rawTitle as ChessTitle)) {
        title = rawTitle as ChessTitle;
      }
    }

    const fideId = fideIdx !== -1 && cells[fideIdx] ? cells[fideIdx].trim() : undefined;
    const federation = fedIdx !== -1 && cells[fedIdx] ? cells[fedIdx].trim().toUpperCase() : 'FID';
    const club = clubIdx !== -1 && cells[clubIdx] ? cells[clubIdx].trim() : undefined;
    const email = emailIdx !== -1 && cells[emailIdx] ? cells[emailIdx].trim() : undefined;
    const phone = phoneIdx !== -1 && cells[phoneIdx] ? cells[phoneIdx].trim() : undefined;
    const birthdate = birthdateIdx !== -1 && cells[birthdateIdx] ? cells[birthdateIdx].trim() : undefined;

    validPlayers.push({
      name,
      surname: name,
      rating,
      title,
      fideId,
      federation,
      club,
      email,
      phone,
      birthdate,
      isActive: true,
    });
  }

  return {
    validPlayers,
    errors,
    totalRows: lines.length - 1,
  };
}

export function generateSampleCsv(): string {
  return [
    'Name,Rating,Title,FIDE ID,Federation,Club,Email',
    'GM Hikaru Nakamura,2800,GM,2016192,USA,Metro Chess Club,hikaru@example.com',
    'IM Carissa Yip,2420,IM,2088860,USA,Metro Chess Club,carissa@example.com',
    'FM Alice Lee,2390,FM,2098450,USA,Metro Chess Club,alice@example.com',
    'Jonathan Baker,1950,None,,USA,Eastside Chess,jonathan@example.com',
    'Elena Rostova,1740,None,,FID,Metro Chess Club,elena@example.com',
  ].join('\n');
}

export function generateSampleTrf(): string {
  return [
    '012 FIDE Sample Rapid Open',
    '022 City Chess Hall',
    '032 FID',
    '001    1 GM Carlsen, Magnus             2830 NOR 1503014        1990-11-30  0.0    1',
    '001    2 GM Nakamura, Hikaru            2800 USA 2016192        1987-12-09  0.0    2',
    '001    3 IM Praggnanandhaa, R           2750 IND 25059530       2005-08-10  0.0    3',
    '001    4 IM Yip, Carissa                2420 USA 2088860        2003-09-10  0.0    4',
    '001    5 FM Lee, Alice                  2390 USA 2098450        2009-10-13  0.0    5',
    '001    6    Baker, Jonathan             1950 USA                1995-04-20  0.0    6',
  ].join('\n');
}

export function generateSampleJson(): string {
  return JSON.stringify(
    [
      {
        name: 'Magnus Carlsen',
        rating: 2830,
        title: 'GM',
        fideId: '1503014',
        federation: 'NOR',
        club: 'Offerspill Sjakklubb',
        email: 'magnus@example.com',
      },
      {
        name: 'Hikaru Nakamura',
        rating: 2800,
        title: 'GM',
        fideId: '2016192',
        federation: 'USA',
        club: 'Metro Chess Club',
        email: 'hikaru@example.com',
      },
      {
        name: 'Gukesh D',
        rating: 2794,
        title: 'GM',
        fideId: '46616543',
        federation: 'IND',
        club: 'WACA',
        email: 'gukesh@example.com',
      },
      {
        name: 'Carissa Yip',
        rating: 2420,
        title: 'IM',
        fideId: '2088860',
        federation: 'USA',
        club: 'Metro Chess Club',
        email: 'carissa@example.com',
      },
      {
        name: 'Jonathan Baker',
        rating: 1950,
        title: 'None',
        federation: 'USA',
        club: 'Eastside Chess',
        email: 'jonathan@example.com',
      },
    ],
    null,
    2
  );
}

export function exportPlayersToCsv(players: Player[]): string {
  const headers = ['Name', 'Rating', 'Title', 'FIDE ID', 'Federation', 'Club', 'Email', 'Status'];
  const rows = players.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    p.rating,
    p.title,
    p.fideId || '',
    p.federation,
    `"${(p.club || '').replace(/"/g, '""')}"`,
    p.email || '',
    p.isActive ? 'Active' : 'Inactive',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCsv(filename: string, content: string): void {
  downloadFile(filename, content, 'text/csv');
}

