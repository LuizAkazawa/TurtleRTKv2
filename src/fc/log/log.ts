import RNFS from 'react-native-fs';
import { decode } from '../Caster/NTRIP/nmea/nmea.js';
import { copyFile } from 'react-native-saf-x';




// Method to export Log to GPX, making the logs understandable by OpenStreetMap
export const exportLogToGPX = async (fileName: string, rawContent: string): Promise<void> => {
  // we separate the lines and only keep the GGA lines
  const lines = rawContent.split('\n');
  const ggaLines = lines.filter(l => l.includes('GGA'));

  // gpx header initialisation
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TurtleRTKv2" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${fileName}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>RTK Trace</name>
    <trkseg>`;

  // convertion of each line into GPX
  let validPoints = 0;

ggaLines.forEach(line => {
    try {
        const cleanLine = line.slice(line.indexOf('$')).trim();
      const result = decode(cleanLine);

      if (result && result.valid && result.loc && result.loc.geojson) {

        const coords = result.loc.geojson.coordinates;

        const lat = coords[0];
        const lon = coords[1];
        const alt = result.altitude !== null ? result.altitude : 0;
        if (!isNaN(lat) && !isNaN(lon)) {
          gpx += `
      <trkpt lat="${lat.toFixed(8)}" lon="${lon.toFixed(8)}">
        <ele>${alt}</ele>
        <time>${result.datetime ? result.datetime.toISOString() : new Date().toISOString()}</time>
      </trkpt>`;
          validPoints++;
        }
      }
      }  catch (e) { /* ignoring the bad format lines */ }
  });

  //end of the gpx file
  gpx += `
    </trkseg>
  </trk>
</gpx>`;

// saving the file
const gpxFileName = fileName.replace('.txt', '').replace('.ubx', '') + '.gpx';
const exportDir = `${RNFS.DownloadDirectoryPath}/TurtleRTKv2`;

// create folder if doesnt exist
const dirExists = await RNFS.exists(exportDir);
if (!dirExists) {
  await RNFS.mkdir(exportDir);
}

await RNFS.writeFile(`${exportDir}/${gpxFileName}`, gpx, 'utf8');
alert(`File exported to: Downloads/TurtleRTKv2/${gpxFileName}`);

};