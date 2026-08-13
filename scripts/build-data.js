const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");

// Since this script is now in the `scripts/` folder, the root is one level up
const ROOT_DIR = path.join(__dirname, '..');

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
    const contentsPath = path.join(ROOT_DIR, "CONTENTS");
    
    if (!fs.existsSync(contentsPath)) {
      console.warn("CONTENTS directory not found at", contentsPath);
      process.exit(0);
    }

    // 1. Process Global MUSICS Folder
    const globalMusicsPath = path.join(contentsPath, "MUSICS");
    const globalSongDetailsPath = path.join(globalMusicsPath, "SONG DETAILS.txt");
    const trackNameMap = {};
    
    if (fs.existsSync(globalSongDetailsPath)) {
      try {
        const lines = fs.readFileSync(globalSongDetailsPath, "utf-8").split("\n");
        for (const line of lines) {
          const parts = line.split("->");
          if (parts.length === 2) {
            const trackKey = parts[0].trim().toUpperCase(); 
            const trackName = parts[1].trim(); 
            trackNameMap[trackKey] = trackName;
          }
        }
      } catch (err) {
        console.warn("Failed to parse global SONG DETAILS.txt");
      }
    }

    let globalMusics = [];
    if (fs.existsSync(globalMusicsPath)) {
      const files = fs.readdirSync(globalMusicsPath).filter(f => f.endsWith(".mp3") || f.endsWith(".wav"));
      globalMusics = await Promise.all(files.map(async file => {
        const url = `./CONTENTS/MUSICS/${file}`;
        let name = file.replace(".mp3", "").replace(".wav", ""); 
        
        if (trackNameMap[name.toUpperCase()]) {
          name = trackNameMap[name.toUpperCase()];
        } else {
          try {
            const metadata = await mm.parseFile(path.join(globalMusicsPath, file));
            if (metadata.common.title) {
              name = metadata.common.title;
              if (metadata.common.artist) name = `${metadata.common.artist} - ${name}`;
            }
          } catch (e) {
            console.warn(`Could not parse ID3 tags for ${file}`);
          }
        }
        return { url, name };
      }));
    }

    // 2. Process Each Driver
    const driverDirs = fs.readdirSync(contentsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.toUpperCase().startsWith("DRIVER"))
      .map(dirent => dirent.name);

    const driversData = await Promise.all(driverDirs.map(async (dirName) => {
      const driverPath = path.join(contentsPath, dirName);
      
      const nameParts = dirName.split("-");
      const fullName = nameParts.length > 1 ? nameParts[1].trim() : dirName;

      let about = "";
      const aboutPath = path.join(driverPath, "ABOUT.txt");
      if (fs.existsSync(aboutPath)) {
        about = fs.readFileSync(aboutPath, "utf-8");
      }

      let carImage = "";
      const carModelPath = path.join(driverPath, "F1 CAR MODEL");
      if (fs.existsSync(carModelPath)) {
        const carFiles = fs.readdirSync(carModelPath);
        if (carFiles.length > 0) {
          carImage = `./CONTENTS/${dirName}/F1 CAR MODEL/${carFiles[0]}`;
        }
      }

      let images = [];
      const imagesPath = path.join(driverPath, "IMAGES");
      if (fs.existsSync(imagesPath)) {
        images = fs.readdirSync(imagesPath)
          .filter(file => file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png"))
          .map(file => `./CONTENTS/${dirName}/IMAGES/${file}`);
      }

      return {
        id: dirName,
        full_name: fullName,
        about,
        car_image: carImage,
        images,
        musics: globalMusics, // Assign the global music pool to EVERY driver
        accent: getAccentColor(fullName),
        driver_number: getDriverNumber(fullName)
      };
    }));

    const outputPath = path.join(__dirname, "..", "data.json");
    fs.writeFileSync(outputPath, JSON.stringify({ drivers: driversData }, null, 2));
    console.log("Successfully generated data.json!");

  } catch (error) {
    console.error("Error reading CONTENTS:", error);
    process.exit(1);
  }
}

buildData();
