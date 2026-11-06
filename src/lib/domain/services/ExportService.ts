import { Player, Tournament, TournamentRegistration, Pairing, StandingsRow, Round } from '../types';
import { EditableEventItem, FormSubmission, ContentAuditEntry } from '../../storage/contentStore';

export class ExportService {
  /**
   * Formula injection protection: prepend apostrophe if string starts with formula triggers
   */
  private static sanitizeCell(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      str = `'${str}`;
    }
    // Escape double quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  /**
   * Export Player List to CSV
   */
  public static exportPlayersToCSV(players: Player[]): string {
    const headers = [
      'CCI ID',
      'Name',
      'FIDE ID',
      'CCI Standard',
      'CCI Rapid',
      'CCI Blitz',
      'Category',
      'City',
      'State',
      'Club',
      'Matches',
      'Win %'
    ];

    const rows = players.map((p) => [
      this.sanitizeCell(p.cciPlayerId),
      this.sanitizeCell(p.name),
      this.sanitizeCell(p.fideId || ''),
      p.cciStandardRating,
      p.cciRapidRating,
      p.cciBlitzRating,
      this.sanitizeCell(p.currentCategory?.name || 'Category 2'),
      this.sanitizeCell(p.city),
      this.sanitizeCell(p.state),
      this.sanitizeCell(p.club || ''),
      p.stats.matchesPlayed,
      `${p.stats.winPercentage}%`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export Starting List to CSV
   */
  public static exportStartingListToCSV(
    tournament: Tournament,
    registrations: TournamentRegistration[],
    players: Player[]
  ): string {
    const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));
    const headers = [
      'Starting No',
      'CCI ID',
      'Player Name',
      'Initial Rating',
      'Category',
      'FIDE ID',
      'Club',
      'Attendance',
      'Confirmation'
    ];

    const rows = registrations
      .sort((a, b) => a.seedNumber - b.seedNumber)
      .map((r) => {
        const p = playerMap.get(r.playerId);
        return [
          r.seedNumber,
          this.sanitizeCell(p?.cciPlayerId || ''),
          this.sanitizeCell(p?.name || ''),
          r.initialRating,
          this.sanitizeCell(p?.currentCategory?.name || ''),
          this.sanitizeCell(p?.fideId || ''),
          this.sanitizeCell(p?.club || ''),
          r.attendance,
          r.isConfirmed ? 'CONFIRMED' : 'PENDING'
        ];
      });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export Round Pairings to CSV
   */
  public static exportPairingsToCSV(
    roundNumber: number,
    pairings: Pairing[],
    players: Player[]
  ): string {
    const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));
    const headers = [
      'Board',
      'White Name',
      'White CCI ID',
      'White Rating',
      'Result',
      'Black Name',
      'Black CCI ID',
      'Black Rating'
    ];

    const rows = pairings
      .sort((a, b) => a.boardNumber - b.boardNumber)
      .map((m) => {
        const white = playerMap.get(m.whitePlayerId);
        const black = m.blackPlayerId ? playerMap.get(m.blackPlayerId) : null;

        return [
          m.boardNumber,
          this.sanitizeCell(white?.name || 'BYE'),
          this.sanitizeCell(white?.cciPlayerId || ''),
          white ? white.cciRapidRating : '',
          this.sanitizeCell(m.result),
          this.sanitizeCell(black ? black.name : (m.result === 'BYE' ? 'BYE' : 'Unpaired')),
          this.sanitizeCell(black ? black.cciPlayerId : ''),
          black ? black.cciRapidRating : ''
        ];
      });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export Standings to CSV
   */
  public static exportStandingsToCSV(tournament: Tournament, standings: StandingsRow[]): string {
    const headers = [
      'Rank',
      'Starting No',
      'Player Name',
      'CCI ID',
      'Points',
      'Buchholz Cut-1',
      'Buchholz',
      'Sonneborn-Berger',
      'Wins',
      'Start Rating',
      'Rating Change',
      'Category'
    ];

    const rows = standings.map((s) => [
      s.rank,
      s.startingRank,
      this.sanitizeCell(s.player.name),
      this.sanitizeCell(s.player.cciPlayerId),
      s.points,
      s.tieBreaks.buchholzCut1,
      s.tieBreaks.buchholz,
      s.tieBreaks.sonnebornBerger,
      s.wins,
      s.startRating,
      s.ratingChange > 0 ? `+${s.ratingChange}` : s.ratingChange,
      this.sanitizeCell(s.category.name)
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export Events to CSV
   */
  public static exportEventsToCSV(events: EditableEventItem[]): string {
    const headers = ['Title', 'Category', 'City', 'Venue', 'Starts At', 'Format', 'Time Control', 'Fee', 'Prize Pool', 'Status'];
    const rows = events.map(e => [
      this.sanitizeCell(e.title),
      this.sanitizeCell(e.category),
      this.sanitizeCell(e.city),
      this.sanitizeCell(e.venue),
      this.sanitizeCell(e.startsAt),
      this.sanitizeCell(e.format),
      this.sanitizeCell(e.timeControl),
      this.sanitizeCell(e.entryFee),
      this.sanitizeCell(e.prizePool),
      this.sanitizeCell(e.publishedStatus),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export Submissions to CSV
   */
  public static exportSubmissionsToCSV(submissions: FormSubmission[]): string {
    const headers = ['ID', 'Type', 'Name', 'Email', 'Phone', 'City', 'Created At'];
    const rows = submissions.map(s => [
      this.sanitizeCell(s.id),
      this.sanitizeCell(s.type),
      this.sanitizeCell(s.name || ''),
      this.sanitizeCell(s.email),
      this.sanitizeCell(s.phone || ''),
      this.sanitizeCell(s.city || ''),
      this.sanitizeCell(new Date(s.createdAt).toLocaleString()),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generate Excel Spreadsheet (XML format compatible with Excel, Google Sheets, Numbers)
   */
  public static generateExcelSpreadsheet(sheetName: string, headers: string[], rows: (string | number)[][]): string {
    const headerXml = headers.map(h => `<Cell><Data ss:Type="String">${this.escapeXml(String(h))}</Data></Cell>`).join('');
    const rowsXml = rows.map(r => {
      const cellsXml = r.map(c => {
        const isNum = typeof c === 'number';
        return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${this.escapeXml(String(c))}</Data></Cell>`;
      }).join('');
      return `<Row>${cellsXml}</Row>`;
    }).join('');

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${this.escapeXml(sheetName)}">
  <Table>
   <Row>${headerXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Trigger browser CSV file download
   */
  public static downloadCSV(content: string, filename: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Trigger browser Excel file download (.xls / .xlsx XML)
   */
  public static downloadExcel(sheetName: string, headers: string[], rows: (string | number)[][], filename: string): void {
    if (typeof window === 'undefined') return;
    const xml = this.generateExcelSpreadsheet(sheetName, headers, rows);
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
