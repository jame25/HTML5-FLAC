# FLAC Player

A lightweight HTML5 web music player with FLAC support that runs in a Docker container. This project provides a clean, minimalist interface for playing FLAC audio files with metadata extraction.

![FLAC Player Screenshot](screenshot.png)

## Features

- FLAC audio playback support
- Automatic directory scanning for FLAC files
- Metadata extraction from FLAC tags
- Automatic album art detection from the music directory
- Responsive design with prominent album art display
- Dark mode theme
- Docker containerization

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/) (optional but recommended)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/jame25/html5-flac.git
cd html5-flac
```

### 2. Add your FLAC music files

Place your FLAC audio files in the `public/music` directory or its subdirectories. The player will automatically scan and find all `.flac` files.

The player extracts metadata from FLAC tags. If tags are not available, it attempts to extract artist and title information from filenames if they follow formats like:
- `Artist - Title.flac`
- `01 Artist - Title.flac`
- `01 - Artist - Title.flac`

### 3. Album Art

The player automatically looks for album art images in the same directory as your FLAC files. It will check for:

1. Common album art filenames like `cover.jpg`, `folder.jpg`, `album.jpg`, etc.
2. Images with the same name as the FLAC file (e.g., `song.jpg` for `song.flac`)
3. Images with the same name as the directory (often the album name)
4. Any image file in the directory if none of the above are found

Supported image formats: JPG, JPEG, PNG, GIF, and WebP.

### 4. Build and run with Docker

Using Docker Compose (recommended):

```bash
docker-compose up -d --build
```

Or using Docker directly:

```bash
docker build -t html5flac .
docker run -p 3000:3000 -v $(pwd)/public/music:/app/public/music -d html5flac
```

### 5. Access the player

Open your browser and navigate to:

```
http://localhost:3000
```

## Development

If you want to run the application locally without Docker:

```bash
npm install
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Troubleshooting

### DNS Resolution Issues

If you encounter errors like `EAI_AGAIN` when building the Docker image, it may be a DNS resolution issue. You can fix this by configuring Docker's DNS settings:

1. Edit `/etc/docker/daemon.json` (create it if it doesn't exist):
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

2. Restart Docker:
```bash
sudo systemctl restart docker
```

### Audio Playback Issues

If audio doesn't play when you click the play button:

1. Make sure your FLAC files are valid and not corrupted
2. Check the browser console for errors
3. Try a different browser (Chrome and Firefox have the best FLAC support)
4. Ensure your browser's audio is not muted
5. Try clicking the play button multiple times (first click initializes the audio context)

### Album Art Issues

If album art isn't displaying correctly:

1. Make sure the image files are in the same directory as your FLAC files
2. Check that the image files have common names like `cover.jpg` or match the FLAC filename
3. Verify that the image files are in a supported format (JPG, JPEG, PNG, GIF, WebP)

## Acknowledgments

- Uses HTML5 Audio API for FLAC playback
- Uses [music-metadata](https://github.com/borewit/music-metadata) for reading FLAC tags 
