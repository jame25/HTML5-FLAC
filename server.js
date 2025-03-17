const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { promisify } = require('util');
const mm = require('music-metadata');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Common image extensions for album art
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Function to find album art in the same directory as the FLAC file
async function findAlbumArt(directory, filename) {
  try {
    const files = await readdir(directory);
    
    // Common album art filenames
    const commonNames = [
      'cover', 'folder', 'album', 'art', 'front', 
      filename.substring(0, filename.lastIndexOf('.')), // Same name as the FLAC file
      path.basename(directory) // Directory name (often album name)
    ];
    
    // First, look for exact matches with common names
    for (const name of commonNames) {
      for (const ext of IMAGE_EXTENSIONS) {
        const potentialFile = `${name}${ext}`;
        if (files.includes(potentialFile)) {
          return path.join(directory, potentialFile).replace(/\\/g, '/');
        }
        // Also check for case-insensitive matches
        const lowerPotentialFile = potentialFile.toLowerCase();
        const match = files.find(f => f.toLowerCase() === lowerPotentialFile);
        if (match) {
          return path.join(directory, match).replace(/\\/g, '/');
        }
      }
    }
    
    // If no exact matches, look for any image file in the directory
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        return path.join(directory, file).replace(/\\/g, '/');
      }
    }
  } catch (error) {
    console.error('Error finding album art:', error);
  }
  
  // Return default cover if no album art found
  return '/img/default-cover.svg';
}

// Function to extract metadata from FLAC file
async function extractMetadata(filePath) {
  try {
    const metadata = await mm.parseFile(filePath);
    
    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      track: metadata.common.track,
      genre: metadata.common.genre ? metadata.common.genre.join(', ') : undefined
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
}

// Function to scan directories recursively for FLAC files
async function scanDirectory(directory) {
  const files = [];
  
  async function scan(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(path.join(__dirname, 'public'), fullPath);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.flac')) {
        // Get basic metadata from filename
        const filename = entry.name;
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        
        // Default values from filename
        let artist = 'Unknown Artist';
        let title = nameWithoutExt;
        
        // Pattern 1: "Artist - Title"
        if (nameWithoutExt.includes(' - ')) {
          const parts = nameWithoutExt.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        } 
        // Pattern 2: "01 Artist - Title" or "01. Artist - Title" or "01 - Artist - Title"
        else if (/^\d+[\s.-]+/.test(nameWithoutExt)) {
          const withoutTrackNum = nameWithoutExt.replace(/^\d+[\s.-]+/, '');
          if (withoutTrackNum.includes(' - ')) {
            const parts = withoutTrackNum.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }
        }
        
        // Clean up title and artist (remove file extensions, brackets, etc.)
        title = title.replace(/\.(mp3|wav|ogg|flac)$/i, '')
                     .replace(/[\[\(].*?[\]\)]/g, '')
                     .trim();
        
        // Try to extract metadata from file tags
        const metadata = await extractMetadata(fullPath);
        
        // Use metadata if available, otherwise use filename-derived info
        if (metadata && metadata.title) {
          title = metadata.title;
        }
        
        if (metadata && metadata.artist) {
          artist = metadata.artist;
        }
        
        // Find album art in the same directory
        const albumArt = await findAlbumArt(dir, filename);
        
        // Convert album art path to be relative to public directory
        let coverUrl = albumArt;
        if (albumArt !== '/img/default-cover.svg') {
          coverUrl = '/' + path.relative(path.join(__dirname, 'public'), albumArt).replace(/\\/g, '/');
        }
        
        files.push({
          title: title,
          artist: artist,
          album: metadata?.album || 'Unknown Album',
          url: relativePath.replace(/\\/g, '/'),
          cover: coverUrl
        });
      }
    }
  }
  
  await scan(directory);
  return files;
}

// API endpoint to scan for FLAC files
app.get('/api/scan', async (req, res) => {
  try {
    const musicDir = path.join(__dirname, 'public', 'music');
    const files = await scanDirectory(musicDir);
    res.json(files);
  } catch (error) {
    console.error('Error scanning directory:', error);
    res.status(500).json({ error: 'Failed to scan directory' });
  }
});

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 