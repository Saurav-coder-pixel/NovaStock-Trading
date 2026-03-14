// geopoliticalService.ts
// Provides real-time + curated geopolitical event markers for the globe.

export type MarkerCategory =
  | 'earthquake'
  | 'conflict'
  | 'military'
  | 'nuclear'
  | 'ship'
  | 'aircraft'
  | 'market';

export interface GeoMarker {
  id: string;
  lat: number;
  lon: number;
  category: MarkerCategory;
  label: string;
  detail: string;
  intensity: number; // 0-1
  color: string;
  pulse: boolean;
}

// ─── Color map per category ─────────────────────────────────
export const CATEGORY_COLORS: Record<MarkerCategory, string> = {
  earthquake: '#f97316',
  conflict:   '#ef4444',
  military:   '#6366f1',
  nuclear:    '#22c55e',
  ship:       '#06b6d4',
  aircraft:   '#e2e8f0',
  market:     '#10b981',
};

// ─── Static Conflict Zones (~20 active) ─────────────────────
const CONFLICT_DATA: Omit<GeoMarker, 'id' | 'color' | 'pulse' | 'category'>[] = [
  { lat: 48.5,  lon: 32.0,  label: 'Ukraine War',      detail: 'Active combat along eastern front lines. Russian offensive operations ongoing.', intensity: 1.0 },
  { lat: 31.5,  lon: 34.5,  label: 'Gaza Conflict',    detail: 'Ongoing military operations. Humanitarian crisis at critical level.', intensity: 1.0 },
  { lat: 15.5,  lon: 32.5,  label: 'Sudan Civil War',  detail: 'RSF vs SAF fighting continues in Khartoum and Darfur regions.', intensity: 0.85 },
  { lat: 16.5,  lon: 44.0,  label: 'Yemen Conflict',   detail: 'Houthi attacks on Red Sea shipping; coalition airstrikes continue.', intensity: 0.8 },
  { lat: 17.0,  lon: 96.0,  label: 'Myanmar Conflict', detail: 'Military junta vs. resistance forces across multiple states.', intensity: 0.75 },
  { lat: 8.0,   lon: 37.0,  label: 'Ethiopia Tensions',detail: 'Renewed clashes in Amhara and Oromia regions.', intensity: 0.6 },
  { lat: 7.5,   lon: 28.5,  label: 'S. Sudan Crisis',  detail: 'Inter-communal violence and political instability.', intensity: 0.55 },
  { lat: 12.0,  lon: 15.0,  label: 'Lake Chad Basin',  detail: 'Boko Haram/ISWAP insurgency across Chad, Niger, Nigeria.', intensity: 0.65 },
  { lat: 14.0,  lon: 1.5,   label: 'Sahel Conflict',   detail: 'JNIM insurgency across Burkina Faso and Mali escalating.', intensity: 0.7 },
  { lat: 33.5,  lon: 44.5,  label: 'Iraq Tensions',    detail: 'Iran-backed militia attacks on US forces, Iranian border skirmishes.', intensity: 0.5 },
  { lat: 35.5,  lon: 36.5,  label: 'N. Syria',         detail: 'Turkish operations vs SDF; remnant ISIS pockets active.', intensity: 0.55 },
  { lat: 27.0,  lon: 68.0,  label: 'Pak-Afghan Border',detail: 'TTP cross-border strikes, Pakistani retaliatory airstrikes.', intensity: 0.6 },
  { lat: 10.5,  lon: -12.5, label: 'Guinea Tensions',  detail: 'Post-coup political instability and armed group activity.', intensity: 0.4 },
  { lat: 5.0,   lon: -5.5,  label: 'W. Africa Unrest', detail: 'Separatist activity in anglophone regions of Cameroon.', intensity: 0.45 },
  { lat: -4.0,  lon: 29.5,  label: 'DRC Conflict',     detail: 'M23 rebels and FDLR ongoing fighting in eastern DRC.', intensity: 0.75 },
  { lat: 33.0,  lon: 35.5,  label: 'Lebanon-Israel',   detail: 'Heightened Hezbollah-IDF exchanges along blue line.', intensity: 0.65 },
  { lat: -15.0, lon: 35.0,  label: 'Mozambique N.',    detail: 'ISCAP (ISIS-linked) insurgency in Cabo Delgado province.', intensity: 0.5 },
  { lat: 41.4,  lon: 45.0,  label: 'Armenia-Azerbaijan',detail:'Post-war tensions; enclave population displacement ongoing.', intensity: 0.4 },
  { lat: -12.5, lon: 17.5,  label: 'Angola UNITA',     detail: 'Sporadic UNITA insurgent activity in eastern provinces.', intensity: 0.3 },
  { lat: 15.5,  lon: 108.0, label: 'South China Sea',  detail: 'PLA-Navy vs Philippine Coast Guard confrontations at Spratly Islands.', intensity: 0.7 },
];

// ─── Static Military Bases ───────────────────────────────────
const MILITARY_DATA: Omit<GeoMarker, 'id' | 'color' | 'pulse' | 'category'>[] = [
  { lat: 35.5,  lon: 139.8, label: 'Yokota AB',      detail: 'USAF Yokota Air Base, Japan. 700+ personnel, F-16 fleet.', intensity: 0.7 },
  { lat: 36.0,  lon: 127.9, label: 'Osan AB',        detail: 'USAF Osan Air Base, South Korea. 7th Air Force HQ.', intensity: 0.7 },
  { lat: 21.4,  lon: 157.9, label: 'Pearl Harbor',   detail: 'US Navy Pearl Harbor-Hickam. Indo-Pacific Command HQ.', intensity: 0.75 },
  { lat: 28.5,  lon: -80.6, label: 'Cape Canaveral', detail: 'US Space Force Eastern Range. Strategic launch facility.', intensity: 0.5 },
  { lat: 51.8,  lon: -1.6,  label: 'RAF Fairford',   detail: 'UK/USAF base. B-2 Spirit strategic bomber deployments.', intensity: 0.6 },
  { lat: 36.9,  lon: 38.1,  label: 'Incirlik AB',    detail: 'USAF-Turkey joint base. Nuclear weapons storage (B61).', intensity: 0.8 },
  { lat: -7.3,  lon: 72.4,  label: 'Diego Garcia',   detail: 'US-UK Joint base. B-52H bombers deployed, submarine support.', intensity: 0.85 },
  { lat: 43.0,  lon: 131.9, label: 'Vladivostok',    detail: 'Russian Pacific Fleet HQ. Nuclear submarines. SSBN patrols.', intensity: 0.75 },
  { lat: 44.5,  lon: 33.5,  label: 'Sevastopol',     detail: 'Russian Black Sea Fleet base. Contested following Ukraine conflict.', intensity: 0.8 },
  { lat: 55.6,  lon: 37.1,  label: 'Moscow CINC',    detail: 'Russian strategic command. RFAS nuclear forces coordination.', intensity: 0.7 },
  { lat: 22.5,  lon: 113.9, label: 'PLA HQ South',   detail: 'PLA Southern Theater Command HQ, Guangzhou.', intensity: 0.65 },
  { lat: 40.0,  lon: 116.3, label: 'PLA HQ Central', detail: 'PLA Central Theater Command, Beijing area.', intensity: 0.6 },
  { lat: 34.9,  lon: 33.6,  label: 'Akrotiri',       detail: 'UK RAF Sovereign Base Area, Cyprus. Strategic posture.', intensity: 0.5 },
  { lat: 11.5,  lon: 42.9,  label: 'Camp Lemonnier', detail: 'US AFRICOM forward base, Djibouti. MQ-9 drone ops.', intensity: 0.65 },
  { lat: 28.0,  lon: 48.5,  label: 'Al Udeid AB',    detail: 'USAF Al Udeid, Qatar. CENTCOM Air Forces FWD HQ.', intensity: 0.75 },
];

// ─── Static Nuclear Facilities ───────────────────────────────
const NUCLEAR_DATA: Omit<GeoMarker, 'id' | 'color' | 'pulse' | 'category'>[] = [
  { lat: 47.5,  lon: 34.6,  label: 'Zaporizhzhia',   detail: 'Largest nuclear plant in Europe. Under Russian military control. Highest risk status.', intensity: 1.0 },
  { lat: 29.0,  lon: 50.9,  label: 'Bushehr NPP',    detail: 'Iranian nuclear power plant. IAEA monitoring. Enrichment concerns.', intensity: 0.75 },
  { lat: 39.8,  lon: 125.8, label: 'Yongbyon',       detail: 'North Korean nuclear research center. Reprocessing activity detected.', intensity: 0.9 },
  { lat: 31.7,  lon: 35.0,  label: 'Dimona',         detail: 'Israel Negev Nuclear Research Center. Estimated 90 warheads.', intensity: 0.7 },
  { lat: 56.0,  lon: 60.6,  label: 'Ozersk',         detail: 'Russian Mayak plutonium complex. Largest nuclear materials site.', intensity: 0.7 },
  { lat: 51.2,  lon: 58.8,  label: 'Dombarovskiy',   detail: 'Russian ICBM silo field. RS-28 Sarmat deployment site.', intensity: 0.8 },
  { lat: 41.6,  lon: -112.4,label: 'Hill AFB',        detail: 'USAF Minuteman III ICBM field. 450 warheads in silos.', intensity: 0.65 },
  { lat: 48.5,  lon: -122.7,label: 'Bangor SSBN',    detail: 'US Navy Trident II SSBN base. Largest US nuclear stockpile site.', intensity: 0.7 },
  { lat: 55.9,  lon: 17.5,  label: 'Baltiysk Sub',   detail: 'Russian Baltic Fleet. Kalibr-equipped submarines.', intensity: 0.6 },
  { lat: 22.2,  lon: 73.7,  label: 'Gujarat NPP',    detail: 'Indian Kakrapar nuclear plant. Operational, IAEA safeguards.', intensity: 0.4 },
  { lat: 33.6,  lon: 126.5, label: 'Wolsong NPP',    detail: 'South Korean nuclear plant. CANDU reactors, tritium production monitored.', intensity: 0.35 },
  { lat: -33.8, lon: 25.1,  label: 'Koeberg NPP',    detail: 'Africa\'s only nuclear plant. South Africa. French-design PWR.', intensity: 0.3 },
];

// ─── Simulated Ship Positions (drift each call) ──────────────
let shipSeed = 42;
const lcg = () => { shipSeed = (shipSeed * 1664525 + 1013904223) & 0xffffffff; return (shipSeed >>> 0) / 4294967296; };

const SHIP_BASE: { lat: number; lon: number; name: string; type: string }[] = [
  { lat: 12.5,  lon: 44.0,  name: 'USS Dwight D. Eisenhower', type: 'CVN Strike Group' },
  { lat: 25.0,  lon: 57.0,  name: 'USS Theodore Roosevelt',   type: 'CVN Strike Group' },
  { lat: 36.0,  lon: 28.0,  name: 'HMS Prince of Wales',      type: 'UK Carrier Group' },
  { lat: 35.5,  lon: 136.5, name: 'USS Ronald Reagan',        type: 'CVN Strike Group' },
  { lat: -28.0, lon: 68.0,  name: 'INS Vikrant',              type: 'Indian Carrier' },
  { lat: 30.0,  lon: 32.0,  name: 'PLA-N Shandong',           type: 'Chinese Carrier' },
  { lat: 14.0,  lon: 43.0,  name: 'USNS Lewis B. Puller',     type: 'ESB – Red Sea Patrol' },
  { lat: 40.5,  lon: 29.5,  name: 'Generic Tanker-7',         type: 'VLCC Oil Tanker' },
  { lat: 1.2,   lon: 104.0, name: 'Generic Container-12',     type: 'Container Vessel' },
  { lat: 51.5,  lon: 1.5,   name: 'MV Baltic Carrier',        type: 'Cargo – North Sea' },
];

// ─── Simulated Aircraft Positions ───────────────────────────
const AIRCRAFT_BASE: { lat: number; lon: number; name: string; type: string }[] = [
  { lat: 50.0,  lon: 30.0,  name: 'NATO AWACS #1',    type: 'E-3 Sentry – Eastern Europe' },
  { lat: 37.0,  lon: 36.0,  name: 'SIGINT Rivet Joint',type: 'RC-135V – Turkey Border' },
  { lat: 22.0,  lon: 119.0, name: 'PLA H-6K',         type: 'Strategic Bomber – ADIZ' },
  { lat: 60.0,  lon: 20.0,  name: 'Swedish Gripen Ptl',type: 'Fighter – Baltic CAP' },
  { lat: 34.0,  lon: 34.0,  name: 'AH-64 Ops',        type: 'CAS – Eastern Med' },
  { lat: 11.0,  lon: 43.0,  name: 'MQ-9 Reaper',      type: 'UAS – Horn of Africa' },
  { lat: 40.0,  lon: 65.0,  name: 'Russian Tu-95M',    type: 'Bear H – Central Asia' },
  { lat: -20.0, lon: 55.0,  name: 'French Rafale M',   type: 'Carrier Strike – Indian Ocean' },
];

// ─── Public API ──────────────────────────────────────────────

export async function fetchEarthquakes(): Promise<GeoMarker[]> {
  try {
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error('USGS fetch failed');
    const data = await res.json();
    // Limit to top 200 by magnitude
    const features = (data.features as any[])
      .sort((a: any, b: any) => b.properties.mag - a.properties.mag)
      .slice(0, 200);

    return features.map((f: any, i: number) => {
      const mag: number = f.properties.mag ?? 0;
      const intensity = Math.min(1, Math.max(0, (mag - 1) / 7)); // 1→0, 8→1
      const color =
        mag >= 6 ? '#ef4444' :
        mag >= 4.5 ? '#f97316' :
        mag >= 3 ? '#f59e0b' :
        '#84cc16';
      const [lon, lat] = f.geometry.coordinates as [number, number];
      return {
        id: `eq-${i}-${f.properties.time}`,
        lat,
        lon,
        category: 'earthquake' as MarkerCategory,
        label: `M${mag.toFixed(1)}`,
        detail: `${f.properties.place ?? 'Unknown'} — Magnitude ${mag.toFixed(1)}`,
        intensity,
        color,
        pulse: mag >= 5.5,
      };
    });
  } catch {
    // Return empty on failure — globe still shows other layers
    return [];
  }
}

export function getConflictMarkers(): GeoMarker[] {
  return CONFLICT_DATA.map((d, i) => ({
    ...d,
    id: `conflict-${i}`,
    category: 'conflict' as MarkerCategory,
    color: CATEGORY_COLORS.conflict,
    pulse: d.intensity >= 0.7,
  }));
}

export function getMilitaryMarkers(): GeoMarker[] {
  return MILITARY_DATA.map((d, i) => ({
    ...d,
    id: `military-${i}`,
    category: 'military' as MarkerCategory,
    color: CATEGORY_COLORS.military,
    pulse: false,
  }));
}

export function getNuclearMarkers(): GeoMarker[] {
  return NUCLEAR_DATA.map((d, i) => ({
    ...d,
    id: `nuclear-${i}`,
    category: 'nuclear' as MarkerCategory,
    color: CATEGORY_COLORS.nuclear,
    pulse: d.intensity >= 0.7,
  }));
}

export function getShipMarkers(): GeoMarker[] {
  return SHIP_BASE.map((s, i) => {
    const drift = (lcg() - 0.5) * 1.5;
    const driftLon = (lcg() - 0.5) * 1.5;
    return {
      id: `ship-${i}`,
      lat: s.lat + drift,
      lon: s.lon + driftLon,
      category: 'ship' as MarkerCategory,
      label: s.name.split(' ').slice(-1)[0],
      detail: `${s.name} — ${s.type}`,
      intensity: 0.5,
      color: CATEGORY_COLORS.ship,
      pulse: false,
    };
  });
}

export function getAircraftMarkers(): GeoMarker[] {
  return AIRCRAFT_BASE.map((a, i) => {
    const drift = (lcg() - 0.5) * 2.5;
    const driftLon = (lcg() - 0.5) * 3.0;
    return {
      id: `aircraft-${i}`,
      lat: a.lat + drift,
      lon: a.lon + driftLon,
      category: 'aircraft' as MarkerCategory,
      label: a.name.split(' ').slice(0, 2).join(' '),
      detail: `${a.name} — ${a.type}`,
      intensity: 0.5,
      color: CATEGORY_COLORS.aircraft,
      pulse: false,
    };
  });
}

// Derive breaking alerts from high-intensity events
export function getBreakingAlerts(
  earthquakes: GeoMarker[],
  conflicts: GeoMarker[],
  nuclearSites: GeoMarker[]
): { id: string; category: MarkerCategory; title: string; detail: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; timestamp: number }[] {
  const alerts: ReturnType<typeof getBreakingAlerts> = [];
  const now = Date.now();

  const highQuakes = earthquakes.filter(e => e.intensity >= 0.6).slice(0, 4);
  highQuakes.forEach(q =>
    alerts.push({ id: q.id, category: 'earthquake', title: q.label + ' ' + q.detail.split('—')[0].trim(), detail: q.detail, severity: q.intensity >= 0.85 ? 'HIGH' : 'MEDIUM', timestamp: now - Math.floor(Math.random() * 3600000) })
  );

  const highConflicts = conflicts.filter(c => c.intensity >= 0.75).slice(0, 4);
  highConflicts.forEach(c =>
    alerts.push({ id: c.id, category: 'conflict', title: c.label, detail: c.detail, severity: c.intensity >= 0.9 ? 'HIGH' : 'MEDIUM', timestamp: now - Math.floor(Math.random() * 7200000) })
  );

  const critNuclear = nuclearSites.filter(n => n.intensity >= 0.8).slice(0, 2);
  critNuclear.forEach(n =>
    alerts.push({ id: n.id, category: 'nuclear', title: n.label + ' Alert', detail: n.detail, severity: 'HIGH', timestamp: now - Math.floor(Math.random() * 1800000) })
  );

  return alerts.sort((a, b) => {
    const sev = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}
