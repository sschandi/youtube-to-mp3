<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <p>{{ savePath }}</p>
    <button @click="setSaveDirectory">Choose Directory</button>
    <input v-model="youtubeURL" type="text">
    <p>infoLoading: {{ infoLoading }}</p>
    <p>{{ loading }}</p>
    <div v-if="videoInfo">
      <label for="title">Title</label>
      <input v-model="title" name="title" type="text">
      <button @click="convert">Convert</button>
    </div>
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
  </div>
</template>

<script>
import { shell, remote, dialog } from 'electron'
import os from 'os'
import fs from 'fs'
import ytdl from 'ytdl-core'
import HelloWorld from './components/HelloWorld.vue'

const ffmpeg = window.require('fluent-ffmpeg')
const binaries = window.require('ffmpeg-binaries')

export default {
	name: 'app',
	components: {
		HelloWorld
	},
	data() {
		return {
			youtubeURL: '',
			savePath: localStorage.getItem('saveDirectory')
				? localStorage.getItem('saveDirectory')
				: os.homedir(),
			videoInfo: null,
			infoLoading: false,
			loading: 0,
			title: '',
			artist: 'test'
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
						this.title = info.title
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
			console.log('convert', this.youtubeURL)
			// import * as path from 'path'
			// const outputPath = path.join(this.savePath, `tmp.mp3`);
			const file = ytdl(this.youtubeURL, { filter: 'audioonly' })

			file.on('progress', (chunk, downloaded, total) => {
				this.loading = downloaded / total
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
			ffmpeg(mp3Path)
				.setFfmpegPath(binaries.ffmpegPath())
				.outputOptions('-metadata', `title=${this.title}`)
				.outputOptions('-metadata', `artist=${this.artist}`)
				.output(`${this.savePath}/${this.title}.mp3`)
				// .audioBitrate(160)
				.on('progress', (progress) => {
					console.log(progress.percent)
				})
				.on('end', () => {
					fs.unlink(`${this.savePath}/${this.title}_temp.mp3`, () => {
						console.log('deleted temp')
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
