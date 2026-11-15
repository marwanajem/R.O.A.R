export const COUNTRIES = [
  'MAS', 'SGP', 'INA', 'BRU', 'THA', 'PHL', 'VNM', 'KHM', 'LAO', 'MMR', // ASEAN priority
  'AFG', 'ALB', 'DZA', 'AND', 'AGO', 'ATG', 'ARG', 'ARM', 'AUS', 'AUT', 'AZE', 'BHS', 'BHR', 
  'BGD', 'BRB', 'BLR', 'BEL', 'BLZ', 'BEN', 'BTN', 'BOL', 'BIH', 'BWA', 'BRA', 'BGR', 'BFA', 
  'BDI', 'CPV', 'KHM', 'CMR', 'CAN', 'CAF', 'TCD', 'CHL', 'CHN', 'COL', 'COM', 'COG', 'COD', 
  'CRI', 'CIV', 'HRV', 'CUB', 'CYP', 'CZE', 'DNK', 'DJI', 'DMA', 'DOM', 'ECU', 'EGY', 'SLV', 
  'GNQ', 'ERI', 'EST', 'SWZ', 'ETH', 'FJI', 'FIN', 'FRA', 'GAB', 'GMB', 'GEO', 'DEU', 'GHA', 
  'GRC', 'GRD', 'GTM', 'GIN', 'GNB', 'GUY', 'HTI', 'HND', 'HUN', 'ISL', 'IND', 'IRN', 'IRQ', 
  'IRL', 'ISR', 'ITA', 'JAM', 'JPN', 'JOR', 'KAZ', 'KEN', 'KIR', 'PRK', 'KOR', 'KWT', 'KGZ', 
  'LVA', 'LBN', 'LSO', 'LBR', 'LBY', 'LIE', 'LTU', 'LUX', 'MDG', 'MWI', 'MDV', 'MLI', 'MLT', 
  'MHL', 'MRT', 'MUS', 'MEX', 'FSM', 'MDA', 'MCO', 'MNG', 'MNE', 'MAR', 'MOZ', 'NAM', 'NRU', 
  'NPL', 'NLD', 'NZL', 'NIC', 'NER', 'NGA', 'MKD', 'NOR', 'OMN', 'PAK', 'PLW', 'PAN', 'PNG', 
  'PRY', 'PER', 'POL', 'PRT', 'QAT', 'ROU', 'RUS', 'RWA', 'KNA', 'LCA', 'VCT', 'WSM', 'SMR', 
  'STP', 'SAU', 'SEN', 'SRB', 'SYC', 'SLE', 'SVK', 'SVN', 'SLB', 'SOM', 'ZAF', 'SSD', 'ESP', 
  'LKA', 'SDN', 'SUR', 'SWE', 'CHE', 'SYR', 'TJK', 'TZA', 'TGO', 'TON', 'TTO', 'TUN', 'TUR', 
  'TKM', 'TUV', 'UGA', 'UKR', 'ARE', 'GBR', 'USA', 'URY', 'UZB', 'VUT', 'VEN', 'YEM', 'ZMB', 
  'ZWE'
];

export const getFlag = (code) => {
  if (!code) return '🏳️';
  
  const commonFlags = {
    MAS: '🇲🇾', SGP: '🇸🇬', INA: '🇮🇩', BRU: '🇧🇳', THA: '🇹🇭', PHL: '🇵🇭', 
    VNM: '🇻🇳', KHM: '🇰🇭', LAO: '🇱🇦', MMR: '🇲🇲', KOR: '🇰🇷', JPN: '🇯🇵', 
    CHN: '🇨🇳', USA: '🇺🇸', GBR: '🇬🇧', AUS: '🇦🇺', ZAF: '🇿🇦', CAN: '🇨🇦',
    IND: '🇮🇳', BRA: '🇧🇷', FRA: '🇫🇷', DEU: '🇩🇪', ITA: '🇮🇹', ESP: '🇪🇸'
  };
  return commonFlags[code] || '🌍'; 
};