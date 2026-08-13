const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");

// Helper to determine accent color from team/driver
function getAccentColor(driverName) {
  const name = driverName.toUpperCase();
  if (name.includes("HAMILTON") || name.includes("LECLERC")) return "#DC0000"; // Ferrari Red
  if (name.includes("RUSSELL") || name.includes("ANTONELLI")) return "#00D2BE"; // Mercedes
  if (name.includes("NORRIS") || name.includes("PIASTRI")) return "#FF8000"; // McLaren Papaya
  if (name.includes("VERSTAPPEN") || name.includes("HADJAR")) return "#0600EF"; // Red Bull Blue
  return "#FFFFFF";
}

// Helper to determine driver jersey number
function getDriverNumber(driverName) {
  const name = driverName.toUpperCase();
  if (name.includes("HAMILTON")) return 44;
  if (name.includes("LECLERC")) return 16;
  if (name.includes("RUSSELL")) return 63;
  if (name.includes("ANTONELLI")) return 12;
  if (name.includes("NORRIS")) return 4;
  if (name.includes("PIASTRI")) return 81;
  if (name.includes("VERSTAPPEN")) return 1;
  if (name.includes("HADJAR")) return 20; // Default/Reserve number
  return 0;
}

async function buildData() {
  try {
    const contentsPath = path.join(process.cwd(), "public", "CONTENTS");
    
    if (!fs.existsSync(contentsPath)) {
      console.warn("CONTENTS directory not found at", contentsPath);
      process.exit(0);
    }

    const driverDirs = fs.readdirSync(contentsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const driversData = await Promise.all(driverDirs.map(async (dirName) => {
      const driverPath = path.join(contentsPath, dirName);
      
      // Parse Driver Name
      const nameParts = dirName.split("-");
      const fullName = nameParts.length > 1 ? nameParts[1].trim() : dirName;

      // Read ABOUT.txt
      let about = "";
      const aboutPath = path.join(driverPath, "ABOUT.txt");
      if (fs.existsSync(aboutPath)) {
        about = fs.readFileSync(aboutPath, "utf-8");
      }

      // Read F1 CAR MODEL
      let carImage = "";
      const carModelPath = path.join(driverPath, "F1 CAR MODEL");
      if (fs.existsSync(carModelPath)) {
        const carFiles = fs.readdirSync(carModelPath);
        if (carFiles.length > 0) {
          carImage = `./CONTENTS/${dirName}/F1 CAR MODEL/${carFiles[0]}`;
        }
      }

      // Read IMAGES
      let images = [];
      const imagesPath = path.join(driverPath, "IMAGES");
      if (fs.existsSync(imagesPath)) {
        images = fs.readdirSync(imagesPath)
          .filter(file => file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png"))
          .map(file => `./CONTENTS/${dirName}/IMAGES/${file}`);
      }

      // Read SONG DETAILS.txt for custom track names
      const trackNameMap = {};
      const rootSongDetailsPath = path.join(process.cwd(), "CONTENTS", dirName, "SONG DETAILS.txt");
      const publicSongDetailsPath = path.join(driverPath, "SONG DETAILS.txt");
      
      let songDetailsPath = "";
      if (fs.existsSync(rootSongDetailsPath)) {
        songDetailsPath = rootSongDetailsPath;
      } else if (fs.existsSync(publicSongDetailsPath)) {
        songDetailsPath = publicSongDetailsPath;
      }

      if (songDetailsPath) {
        try {
          const lines = fs.readFileSync(songDetailsPath, "utf-8").split("\n");
          for (const line of lines) {
            const parts = line.split("->");
            if (parts.length === 2) {
              const trackKey = parts[0].trim().toUpperCase(); // e.g., "TRACK 1"
              const trackName = parts[1].trim(); // e.g., "LOSER - TAME IMPALA"
              trackNameMap[trackKey] = trackName;
            }
          }
        } catch (err) {
          console.warn("Failed to parse SONG DETAILS.txt for", dirName);
        }
      }

      // Read MUSICS
      let musics = [];
      const musicsPath = path.join(driverPath, "MUSICS");
      if (fs.existsSync(musicsPath)) {
        const files = fs.readdirSync(musicsPath).filter(f => f.endsWith(".mp3") || f.endsWith(".wav"));
        musics = await Promise.all(files.map(async file => {
          const url = `./CONTENTS/${dirName}/MUSICS/${file}`;
          let name = file.replace(".mp3", "").replace(".wav", ""); // Default e.g. "TRACK 1"
          
          // Use SONG DETAILS.txt mapping if available!
          if (trackNameMap[name.toUpperCase()]) {
            name = trackNameMap[name.toUpperCase()];
          } else {
            // Fallback to ID3 tags if no text mapping found
            try {
              const metadata = await mm.parseFile(path.join(musicsPath, file));
              if (metadata.common.title) {
                name = metadata.common.title;
                if (metadata.common.artist) {
                  name = `${metadata.common.artist} - ${name}`;
                }
              }
            } catch (e) {
              console.warn(`Could not parse ID3 tags for ${file}`);
            }
          }
          return { url, name };
        }));
      }

      return {
        id: dirName,
        full_name: fullName,
        about,
        car_image: carImage,
        images,
        musics,
        accent: getAccentColor(fullName),
        driver_number: getDriverNumber(fullName)
      };
    }));

    const outputPath = path.join(process.cwd(), "data.json");
    fs.writeFileSync(outputPath, JSON.stringify({ drivers: driversData }, null, 2));
    console.log("Successfully generated data.json!");

  } catch (error) {
    console.error("Error reading CONTENTS:", error);
    process.exit(1);
  }
}

buildData();
