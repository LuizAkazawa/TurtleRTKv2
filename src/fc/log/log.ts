import RNFS from 'react-native-fs';
import { decodeGGAPosition } from '../Caster/NTRIP/nmea/nmea.js';
import { copyFile } from 'react-native-saf-x';

export const exportLogToGPX = async (fileName: string, rawContent: string): Promise<void> => {
  const lines = rawContent.split('\n');
  const ggaLines = lines.filter(l => l.includes('GGA'));

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TurtleRTKv2" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${fileName}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>RTK Trace</name>
    <trkseg>`;

  let validPoints = 0;

  ggaLines.forEach(line => {
    try {
      const cleanLine = line.slice(line.indexOf('$')).trim();

      const prevLat = global.myLatitude;
      const prevLon = global.myLongitude;
      decodeGGAPosition(cleanLine);
      if (global.myLatitude === prevLat && global.myLongitude === prevLon) return; //if lat and long dont change


      // Parse only what we need for GPX
      const arr = cleanLine.split(',');
      const alt = arr[9] ? parseFloat(arr[9]) : 0;
      const timeRaw = arr[1]; // hhmmss.ss
      const dateStr = new Date().toISOString().split('T')[0];
      const time = timeRaw.replace(/(\d{2})(\d{2})(\d{2}).*/, '$1:$2:$3');
      const datetime = new Date(`${dateStr}T${time}.000Z`);

      gpx += `
      <trkpt lat="${global.myLatitude.toFixed(8)}" lon="${global.myLongitude.toFixed(8)}">
        <ele>${alt}</ele>
        <time>${datetime.toISOString()}</time>
      </trkpt>`;
      validPoints++;

    } catch (e) { /* ignore bad format lines */ }
  });

  gpx += `
    </trkseg>
  </trk>
</gpx>`;

  const gpxFileName = fileName.replace('.txt', '').replace('.ubx', '') + '.gpx';
  const exportDir = `${RNFS.DownloadDirectoryPath}/TurtleRTKv2`;

  const dirExists = await RNFS.exists(exportDir);
  if (!dirExists) await RNFS.mkdir(exportDir);

  await RNFS.writeFile(`${exportDir}/${gpxFileName}`, gpx, 'utf8');
  alert(`File exported to: Downloads/TurtleRTKv2/${gpxFileName}`);
};