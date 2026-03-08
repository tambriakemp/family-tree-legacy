export interface ParsedIndividual {
  gedcomId: string;
  first_name: string;
  last_name: string | null;
  birth_date: string | null;
  death_date: string | null;
  gender: 'male' | 'female' | 'unknown';
}

export interface ParsedFamily {
  husbandId: string | null;
  wifeId: string | null;
  childIds: string[];
}

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04',
  MAY: '05', JUN: '06', JUL: '07', AUG: '08',
  SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

function parseGedcomDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/^(ABT|EST|CAL|BEF|AFT|FROM|TO|BET|AND)\s+/i, '').trim();

  // "15 JAN 1950"
  const fullMatch = cleaned.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i);
  if (fullMatch) {
    const month = MONTH_MAP[fullMatch[2].toUpperCase()];
    if (month) return `${fullMatch[3]}-${month}-${fullMatch[1].padStart(2, '0')}`;
  }

  // "JAN 1950"
  const monthYearMatch = cleaned.match(/^([A-Z]{3})\s+(\d{4})$/i);
  if (monthYearMatch) {
    const month = MONTH_MAP[monthYearMatch[1].toUpperCase()];
    if (month) return `${monthYearMatch[2]}-${month}-01`;
  }

  // "1950"
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) return `${yearMatch[1]}-01-01`;

  return null;
}

export function parseGedcom(content: string): { individuals: ParsedIndividual[]; families: ParsedFamily[] } {
  const lines = content.split(/\r?\n/);
  const individuals: ParsedIndividual[] = [];
  const families: ParsedFamily[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for INDI record
    const indiMatch = line.match(/^0\s+(@\S+@)\s+INDI/);
    if (indiMatch) {
      const gedcomId = indiMatch[1];
      let first_name = '';
      let last_name: string | null = null;
      let birth_date: string | null = null;
      let death_date: string | null = null;
      let gender: 'male' | 'female' | 'unknown' = 'unknown';
      i++;

      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.match(/^0\s/)) break;

        if (l.match(/^1\s+NAME\s/)) {
          const nameVal = l.replace(/^1\s+NAME\s+/, '').trim();
          const nameParts = nameVal.match(/^([^/]*?)\s*\/?([^/]*?)\/?$/);
          if (nameParts) {
            first_name = nameParts[1].trim() || '';
            last_name = nameParts[2].trim() || null;
          }
        } else if (l.match(/^1\s+SEX\s/)) {
          const sexVal = l.replace(/^1\s+SEX\s+/, '').trim().toUpperCase();
          if (sexVal === 'M') gender = 'male';
          else if (sexVal === 'F') gender = 'female';
        } else if (l.match(/^1\s+BIRT/)) {
          i++;
          if (i < lines.length) {
            const dl = lines[i].trim();
            const dateMatch = dl.match(/^2\s+DATE\s+(.+)/);
            if (dateMatch) birth_date = parseGedcomDate(dateMatch[1].trim());
            else continue; // don't increment again
          }
        } else if (l.match(/^1\s+DEAT/)) {
          i++;
          if (i < lines.length) {
            const dl = lines[i].trim();
            const dateMatch = dl.match(/^2\s+DATE\s+(.+)/);
            if (dateMatch) death_date = parseGedcomDate(dateMatch[1].trim());
            else continue;
          }
        }
        i++;
      }

      if (!first_name) first_name = 'Unknown';
      individuals.push({ gedcomId, first_name, last_name, birth_date, death_date, gender });
      continue;
    }

    // Check for FAM record
    const famMatch = line.match(/^0\s+(@\S+@)\s+FAM/);
    if (famMatch) {
      let husbandId: string | null = null;
      let wifeId: string | null = null;
      const childIds: string[] = [];
      i++;

      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.match(/^0\s/)) break;

        const husbMatch = l.match(/^1\s+HUSB\s+(@\S+@)/);
        if (husbMatch) husbandId = husbMatch[1];

        const wifeMatch = l.match(/^1\s+WIFE\s+(@\S+@)/);
        if (wifeMatch) wifeId = wifeMatch[1];

        const childMatch = l.match(/^1\s+CHIL\s+(@\S+@)/);
        if (childMatch) childIds.push(childMatch[1]);

        i++;
      }

      families.push({ husbandId, wifeId, childIds });
      continue;
    }

    i++;
  }

  return { individuals, families };
}
