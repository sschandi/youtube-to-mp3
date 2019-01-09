<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <p>{{ savePath }}</p>
    <button @click="setSaveDirectory">Choose Directory</button>
    <input v-model="youtubeURL" type="text">
    <p>infoLoading: {{ infoLoading }}</p>
    <div v-if="videoInfo">
      <p>{{ status }}: {{ loading }}</p>
      <label for="title">Title</label>
      <input v-model="title" name="title" type="text">
      <label for="artist">Artist</label>
      <input v-model="artist" name="artist" type="text">
      <button @click="convert">Convert</button>
    </div>
  </div>
</template>

<script>
import { shell, remote, dialog } from 'electron'
import os from 'os'
import fs from 'fs'
import ytdl from 'ytdl-core'
import getArtistTitle from 'get-artist-title'

const ffmpeg = window.require('fluent-ffmpeg')
const binaries = window.require('ffmpeg-binaries')

export default {
	name: 'app',
	data() {
		return {
			youtubeURL: '',
			savePath: localStorage.getItem('saveDirectory')
				? localStorage.getItem('saveDirectory')
				: os.homedir(),
			videoInfo: null,
			infoLoading: false,
			loading: 0,
			status: 'Downloading',
			title: '',
			artist: ''
		}
	},
	watch: {
		youtubeURL() {
			if (this.youtubeURL.length === 0) {
				this.videoInfo = null
				return
			}
			this.infoLoading = true
			ytdl
				.getInfo(this.youtubeURL)
				.then(
					info => {
						// .thumbnail_url, .title
						this.loading = 0
						this.videoInfo = info
						const artistTitle = getArtistTitle(info.title)
						if (artistTitle) {
							this.title = artistTitle[0]
							this.artist = artistTitle[1]
						} else {
							this.title = info.title
							this.artist = ''
						}
					},
					error => {
						console.log(error)
						this.videoInfo = null
					}
				)
				.finally(() => (this.infoLoading = false))
		}
	},
	methods: {
		setSaveDirectory() {
			const directory = remote.dialog.showOpenDialog(
				remote.getCurrentWindow(),
				{
					title: 'Save Directory',
					properties: ['openDirectory']
				}
			)
			if (directory) {
				this.savePath = directory[0]
				localStorage.setItem('saveDirectory', directory[0])
			}
			// shell.showItemInFolder(remote.app.getPath('downloads'))
		},
		convert() {
			this.loading = 0
			this.status = 'Downloading'
			const file = ytdl(this.youtubeURL, { filter: 'audioonly' })

			file.on('progress', (chunk, downloaded, total) => {
				this.loading = (downloaded / total) * 100
			})

			file
				.pipe(fs.createWriteStream(`${this.savePath}/${this.title}_temp.mp3`))
				.on('finish', () => {
					this.loading = 100
					this.addID3Tags(`${this.savePath}/${this.title}_temp.mp3`)
					console.log('we r done')
				})
		},
		addID3Tags(mp3Path) {
			this.loading = 0
			this.status = 'Processing'
			ffmpeg(mp3Path)
				.setFfmpegPath(binaries.ffmpegPath())
				.outputOptions('-metadata', `title=${this.title}`)
				.outputOptions('-metadata', `artist=${this.artist}`)
				.output(`${this.savePath}/${this.title}.mp3`)
				// .audioBitrate(160)
				.on('progress', progress => {
					this.loading = progress.percent
				})
				.on('end', () => {
					fs.unlink(`${this.savePath}/${this.title}_temp.mp3`, () => {
						this.loading = 100
						this.status = 'Complete'
					})
				})
				.run()
		}
	}
}
</script>

<style lang="scss">
#app {
	font-family: 'Avenir', Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
}
</style>
