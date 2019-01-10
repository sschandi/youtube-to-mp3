<template>
  <div id="app">
		<div id="title">
			<h1>Youtube to MP3</h1>
		</div>
		<!-- <img alt="Vue logo" src="./assets/logo.png"> -->
		<div id="content">
			<div v-show="!converting">
				<div class="input-container">
					<div class="input">
						<p>URL</p>
						<input v-model="youtubeURL" for="url" type="text">
					</div>
				</div>
				<div v-if="infoLoading">
					<BallBeatLoader/>
				</div>
				<!-- <button class="btn" @click="openSaveDirectory">Open Directory</button> -->
				<div v-if="videoInfo">
					<h3>Info:</h3>
					<div class="input-container">
						<div class="input">
							<p>Title</p>
							<input v-model="title" name="title" type="text">
						</div>
					</div>
					<div class="input-container">
						<div class="input">
							<p>Artist</p>
							<input v-model="artist" name="artist" type="text">
						</div>
					</div>
					<button class="btn" @click="convert">Convert</button>
				</div>
			</div>
			<div v-show="converting">
				<h1>{{ status }}</h1>
				<div class="loader-container">
					<BallScaleRippleMultipleLoader class="loader-el" size="200px"/>
					<div class="loader-text">
						<h1>{{ loading | roundNumber }}%</h1>
						<p>{{ status }}</p>
					</div>
				</div>
			</div>
			<button class="btn btn-settings" @click="showSettings = !showSettings">
				<i class="material-icons">settings</i>
			</button>
		</div>
		<div id="settings" v-show="showSettings">
			<p><span class="text-bold">Save Directory:</span> {{ savePath }}
			<button class="btn" @click="setSaveDirectory">Change</button></p>
		</div>
  </div>
</template>

<script>
import { shell, remote, dialog } from 'electron'
import os from 'os'
import fs from 'fs'
import ytdl from 'ytdl-core'
import getArtistTitle from 'get-artist-title'

const ffmpegPath = window
	.require('@ffmpeg-installer/ffmpeg')
	.path.replace('app.asar', 'app.asar.unpacked')
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
			converting: false,
			loading: 0,
			status: 'Downloading',
			title: '',
			artist: '',
			showSettings: false
		}
	},
	filters: {
		roundNumber(number) {
			if (isNaN(number)) {
				return number
			}
			return Math.round(number)
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
	created() {
		console.log(binaries.ffmpegPath(), ffmpegPath)
		console.log(binaries)
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
		},
		openSaveDirectory() {
			// shell.showItemInFolder(remote.app.getPath('downloads'))
			shell.openItem(this.savePath)
		},
		convert() {
			this.loading = 0
			this.status = 'Downloading'
			this.converting = true
			const file = ytdl(this.youtubeURL, { filter: 'audioonly' })

			file.on('progress', (chunk, downloaded, total) => {
				this.loading = (downloaded / total) * 100
			})

			file
				.pipe(fs.createWriteStream(`${this.savePath}/${this.title}_temp.mp3`))
				.on('finish', () => {
					this.loading = 100
					this.addID3Tags(`${this.savePath}/${this.title}_temp.mp3`)
				})
		},
		addID3Tags(mp3Path) {
			this.loading = 0
			this.status = 'Processing'
			ffmpeg(mp3Path)
				.setFfmpegPath(ffmpegPath)
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
						this.converting = false
						this.youtubeURL = ''
					})
				})
				.run()
		}
	}
}
</script>

<style lang="scss">
$white: #ffffff;
$red: #fe2b53;
$shadow: 0 10px 20px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);

html,
body {
	margin: 0;
	font-family: 'Comfortaa', cursive;
	background-image: linear-gradient(
		45deg,
		#312d44 0%,
		#7f69a1 99%,
		#8f75b1 100%
	);
	background-attachment: fixed;
}
#app {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	height: 100vh;
	width: 100vw;
	text-align: center;
	color: $white;
	overflow-x: hidden;
	display: flex;
	flex-direction: column;
}
#title {
	padding-top: 1rem;
}
#content {
	position: relative;
	flex-grow: 1;
	padding-bottom: 1rem;
	.loader-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		.loader-el {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.loader-text {
			margin: 0;
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			// font-size: 60px;
			h1 {
				font-size: 40px;
				margin: 0;
			}
			p {
				margin: 0;
			}
		}
	}
}
#settings {
	background-color: $red;
	box-shadow: $shadow;
	.btn {
		color: $red;
		background-color: $white;
	}
}
.text-bold {
	font-weight: bold;
}
.btn {
	padding: 0.5rem;
	border: none;
	margin: 0.5rem 0.25rem;
	background-color: $red;
	color: $white;
	border-radius: 0.25rem;
	box-shadow: $shadow;
	transition: all 1s ease-out;
	cursor: pointer;
	&:focus {
		outline: none;
	}
	&.btn-settings {
		border-radius: 50%;
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		width: 40px;
		height: 40px;
	}
}
.input-container {
	display: flex;
	width: 100%;
	justify-content: center;
	.input {
		width: 50%;
		display: flex;
		flex-direction: column; // align-items: center; // justify-content: center;
		p {
			width: 100%;
			margin: 0;
			text-align: left;
			font-size: 14px;
			margin-bottom: 0.25rem;
		}
		input {
			-webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
			-moz-box-sizing: border-box; /* Firefox, other Gecko */
			box-sizing: border-box;
			/* Opera/IE 8+ */
			width: 100%;
			border: none;
			padding: 0.5rem 0.25rem;
			color: $white;
			background-color: rgba(255, 255, 255, 0.3);
			margin-bottom: 1rem;
			&:focus {
				outline: none;
			}
		}
	}
}
</style>
