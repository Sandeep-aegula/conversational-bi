import Papa from 'papaparse';

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

export const inferColumns = (data: any[]) => {
  if (data.length === 0) return { numeric: [], categorical: [], time: null };

  const firstRow = data.find(row => Object.values(row).some(v => v !== null));
  if (!firstRow) return { numeric: [], categorical: [], time: null };

  const keys = Object.keys(firstRow);
  const numeric: string[] = [];
  const categorical: string[] = [];
  let time: string | null = null;

  keys.forEach(key => {
    const vals = data.map(d => d[key]).filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return;

    if (key.toLowerCase().match(/date|time|month|year|day|q[1-4]/)) {
      if (!time) time = key;
      return;
    }

    const isNum = vals.every(v => typeof v === 'number');
    if (isNum) {
      numeric.push(key);
      return;
    }

    const uniqueValues = new Set(vals).size;
    if (uniqueValues <= 15) {
      categorical.push(key);
    }
  });

  return { numeric, categorical, time };
};

export const groupBy = (data: any[], groupByCol: string, sumCols: string[]) => {
  const map = new Map<string, any>();
  data.forEach(row => {
    let key = row[groupByCol];
    if (key === undefined || key === null) key = 'Unknown';
    if (!map.has(key)) {
      const init: any = { [groupByCol]: key };
      sumCols.forEach(c => init[c] = 0);
      map.set(key, init);
    }
    const item = map.get(key);
    sumCols.forEach(c => item[c] += (Number(row[c]) || 0));
  });
  return Array.from(map.values());
};

export const analyzeIntents = (query: string) => {
  const lower = query.toLowerCase();
  
  if (lower.match(/show only|filter by|where|just|only/)) return 'FILTER';
  if (lower.match(/change .* to|make .* a|convert|show .* as/)) return 'CHANGE_CHART';
  if (lower.match(/use|switch to|instead of/)) return 'CHANGE_METRIC';
  if (lower.match(/q1|q2|q3|q4|last [0-9]+|first half|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/)) return 'TIME_FILTER';
  if (lower.match(/top|bottom|highest|lowest|best|worst|rank/)) return 'SORT_RANK';
  if (lower.match(/compare|vs|versus|side by side/)) return 'COMPARE';
  if (lower.match(/add|create|generate|show me a|new chart/)) return 'ADD_CHART';
  if (lower.match(/reset|clear|show all|start over/)) return 'RESET';
  if (lower.match(/highlight|focus on|emphasize/)) return 'HIGHLIGHT';
  if (lower.match(/what does|why is|explain|tell me about|what is/)) return 'EXPLAIN';
  
  return 'UNKNOWN';
};

export const extractEntity = (query: string, data: any[], columns: string[]) => {
  const lower = query.toLowerCase();
  
  // Try to find if a column name or a value from a column is mentioned
  for (const col of columns) {
    if (lower.includes(col.toLowerCase())) return { type: 'column', value: col };
  }
  
  // very naive matching for filter categories
  for (const row of data) {
    for (const key of Object.keys(row)) {
      const val = row[key];
      if (typeof val === 'string' && lower.includes(val.toLowerCase())) {
        return { type: 'value', column: key, value: val };
      }
    }
  }
  
  return null;
};
