import Vue from 'vue'
import App from './App.vue'
import 'vue-loaders/dist/vue-loaders.css'
import { BallBeatLoader, BallScaleLoader, BallScaleRippleLoader, BallScaleRippleMultipleLoader, install } from 'vue-loaders'

const VueLoaders = { BallBeatLoader, BallScaleLoader, BallScaleRippleLoader, BallScaleRippleMultipleLoader, install }

Vue.use(VueLoaders)

Vue.config.productionTip = false

new Vue({
	render: h => h(App)
}).$mount('#app')
