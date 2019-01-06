<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <p>{{ savePath }}</p>
    <button @click="setSaveDirectory">Choose Directory</button>
    <input v-model="youtubeURL" type="text"/>
    <button @click="convert">Convert</button>
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import { shell, remote, dialog } from 'electron'
import os from 'os'
import fs from 'fs'
import ytdl from 'ytdl-core'
import HelloWorld from './components/HelloWorld.vue'

export default {
	name: 'app',
	components: {
		HelloWorld
  },
  data() {
    return {
      youtubeURL: '',
      savePath: localStorage.getItem('saveDirectory') ? localStorage.getItem('saveDirectory') : os.homedir(),
    }
  },
  methods: {
    setSaveDirectory() {
      const directory = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Save Directory',
        properties: ['openDirectory']
      })
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
      ytdl(this.youtubeURL, {filter: 'audioonly'}).pipe(fs.createWriteStream(`${this.savePath}/test.mp3`));
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
